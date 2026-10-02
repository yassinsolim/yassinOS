export const STORAGE_VERSION = 1;
export const SHELL_DATABASE = "yassinos-shell";
export const STORE_PREFIX = "v1/";
export const MAX_FILE_BYTES = 65536;
export const MAX_APP_BYTES = 262144;
export const MAX_APP_FILES = 32;
export const MAX_MESSAGE_BYTES = 81920;
export const MAX_NAME_LENGTH = 64;
export const SHARED_NOTE_NAME = "readme.txt";
export const SHARED_NOTE = "Shared notes are read-only.";

const NAME = /^\w[\w.-]{0,63}$/;

export type StoredFile = {
  key: string;
  size: number;
};

export type StorageDriver = {
  clear: (prefix: string) => Promise<void>;
  list: (prefix: string) => Promise<StoredFile[]>;
  read: (key: string) => Promise<Uint8Array | undefined>;
  remove: (key: string) => Promise<void>;
  write: (key: string, bytes: Uint8Array) => Promise<void>;
};

export type FileRequest =
  | { name: string; op: "delete" | "read" | "read-shared" }
  | { op: "list" }
  | { name: string; op: "write"; text: string };

export type FileAnswer =
  | { error: string; ok: false }
  | { names: string[]; ok: true }
  | { ok: true; text: string }
  | { ok: true };

export type StoreKind = "indexeddb" | "memory" | "opfs";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const copyBytes = (bytes: Uint8Array): Uint8Array => {
  const copy = new Uint8Array(bytes.byteLength);

  copy.set(bytes);

  return copy;
};

const settled = <T>(value: T): Promise<T> => Promise.resolve(value);
const done = (): Promise<void> => Promise.resolve();

export const selectStoreKind = (available: {
  idb: boolean;
  opfs: boolean;
}): StoreKind => {
  if (available.opfs) return "opfs";
  if (available.idb) return "indexeddb";

  return "memory";
};

export const normalizeFileName = (input: string): string | undefined => {
  const name = input.normalize("NFKC").trim();

  if (!name || name.length > MAX_NAME_LENGTH) return undefined;
  if (name === "." || name === "..") return undefined;
  if (/[\0/\\]/.test(name)) return undefined;
  if (!NAME.test(name)) return undefined;

  return name;
};

export const appFileKey = (appId: string, name: string): string =>
  `${STORE_PREFIX}apps/${appId}/${name}`;

export const sharedFileKey = (name: string): string =>
  `${STORE_PREFIX}shared/${name}`;

export const memoryDriver = (): StorageDriver => {
  const files = new Map<string, Uint8Array>();

  return {
    clear: (prefix) => {
      [...files.keys()].forEach((key) => {
        if (key.startsWith(prefix)) files.delete(key);
      });

      return done();
    },
    list: (prefix) =>
      settled(
        [...files.entries()]
          .filter(([key]) => key.startsWith(prefix))
          .map(([key, bytes]) => ({ key, size: bytes.byteLength }))
      ),
    read: (key) => {
      const bytes = files.get(key);

      if (!bytes) return Promise.resolve() as Promise<Uint8Array | undefined>;

      return settled(copyBytes(bytes));
    },
    remove: (key) => {
      files.delete(key);

      return done();
    },
    write: (key, bytes) => {
      files.set(key, copyBytes(bytes));

      return done();
    },
  };
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => {
      reject(request.error ?? new Error("storage request failed"));
    });
  });

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const open = indexedDB.open(SHELL_DATABASE, STORAGE_VERSION);

    open.addEventListener("upgradeneeded", () => {
      const db = open.result;

      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    });
    open.addEventListener("success", () => resolve(open.result));
    open.addEventListener("error", () => {
      reject(open.error ?? new Error("storage open failed"));
    });
  });

export const indexedDbDriver = async (): Promise<StorageDriver> => {
  const db = await openDatabase();
  const run = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> => {
    const transaction = db.transaction("files", mode);

    return requestToPromise(action(transaction.objectStore("files")));
  };

  return {
    clear: async (prefix) => {
      const keys = await run<IDBValidKey[]>("readonly", (store) =>
        store.getAllKeys()
      );

      await Promise.all(
        keys
          .filter((key) => typeof key === "string" && key.startsWith(prefix))
          .map((key) => run("readwrite", (store) => store.delete(key)))
      );
    },
    list: async (prefix) => {
      const keys = await run<IDBValidKey[]>("readonly", (store) =>
        store.getAllKeys()
      );
      const matched = keys.filter(
        (key): key is string =>
          typeof key === "string" && key.startsWith(prefix)
      );
      const listed = await Promise.all(
        matched.map(async (key) => {
          const value = await run<unknown>("readonly", (store) =>
            store.get(key)
          );
          const size = value instanceof Uint8Array ? value.byteLength : 0;

          return { key, size };
        })
      );

      return listed;
    },
    read: async (key) => {
      const value = await run<unknown>("readonly", (store) => store.get(key));

      return value instanceof Uint8Array ? value : undefined;
    },
    remove: async (key) => {
      await run("readwrite", (store) => store.delete(key));
    },
    write: async (key, bytes) => {
      await run("readwrite", (store) => store.put(copyBytes(bytes), key));
    },
  };
};

type DirectoryLike = {
  entries: () => AsyncIterable<[string, unknown]>;
  getFileHandle: (
    name: string,
    options: { create: boolean }
  ) => Promise<{
    createWritable: () => Promise<{
      close: () => Promise<void>;
      write: (data: Uint8Array) => Promise<void>;
    }>;
    getFile: () => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
  }>;
  removeEntry: (name: string) => Promise<void>;
};

const fileNameFor = (key: string): string => encodeURIComponent(key);

export const opfsDriver = (directory: DirectoryLike): StorageDriver => ({
  clear: async (prefix) => {
    const names: string[] = [];

    for await (const [name] of directory.entries()) names.push(name);

    await Promise.all(
      names.map(async (name) => {
        const key = decodeURIComponent(name);

        if (key.startsWith(prefix)) await directory.removeEntry(name);
      })
    );
  },
  list: async (prefix) => {
    const listed: StoredFile[] = [];

    for await (const [name] of directory.entries()) {
      const key = decodeURIComponent(name);

      if (key.startsWith(prefix)) {
        const handle = await directory.getFileHandle(name, { create: false });
        const file = await handle.getFile();
        const bytes = new Uint8Array(await file.arrayBuffer());

        listed.push({ key, size: bytes.byteLength });
      }
    }

    return listed;
  },
  read: (key) =>
    directory
      .getFileHandle(fileNameFor(key), { create: false })
      .then((handle) => handle.getFile())
      .then((file) => file.arrayBuffer())
      .then((buffer) => new Uint8Array(buffer))
      .catch(() => Promise.resolve() as Promise<Uint8Array | undefined>),
  remove: async (key) => {
    try {
      await directory.removeEntry(fileNameFor(key));
    } catch {
      // deleting a missing file is fine
    }
  },
  write: async (key, bytes) => {
    const handle = await directory.getFileHandle(fileNameFor(key), {
      create: true,
    });
    const writable = await handle.createWritable();

    await writable.write(copyBytes(bytes));
    await writable.close();
  },
});

type ListedDirectory = FileSystemDirectoryHandle & {
  entries: () => AsyncIterable<[string, FileSystemHandle]>;
};

const openOpfsDriver = async (): Promise<StorageDriver> => {
  const root = await navigator.storage.getDirectory();
  const directory = await root.getDirectoryHandle(SHELL_DATABASE, {
    create: true,
  });
  const listed = directory as ListedDirectory;

  return opfsDriver({
    entries: () => listed.entries(),
    getFileHandle: async (name, options) => {
      const handle = await directory.getFileHandle(name, options);

      return {
        createWritable: async () => {
          const writable = await handle.createWritable();

          return {
            close: () => writable.close(),
            write: async (data) => {
              const buffer = new ArrayBuffer(data.byteLength);

              new Uint8Array(buffer).set(data);
              await writable.write(buffer);
            },
          };
        },
        getFile: async () => {
          const file = await handle.getFile();

          return { arrayBuffer: () => file.arrayBuffer() };
        },
      };
    },
    removeEntry: (name) => directory.removeEntry(name),
  });
};

export const ensureSharedNote = async (
  driver: StorageDriver
): Promise<void> => {
  const key = sharedFileKey(SHARED_NOTE_NAME);
  const existing = await driver.read(key);

  if (existing) return;

  await driver.write(key, textEncoder.encode(SHARED_NOTE));
};

export const openShellStore = async (): Promise<StorageDriver> => {
  const kind = selectStoreKind({
    idb: typeof indexedDB !== "undefined",
    opfs:
      typeof navigator !== "undefined" &&
      typeof navigator.storage?.getDirectory === "function",
  });

  try {
    const driver =
      kind === "opfs"
        ? await openOpfsDriver()
        : kind === "indexeddb"
          ? await indexedDbDriver()
          : memoryDriver();

    await ensureSharedNote(driver);

    return driver;
  } catch {
    const fallback = memoryDriver();

    try {
      await ensureSharedNote(fallback);
    } catch {
      // a note failure still leaves a usable empty store
    }

    return fallback;
  }
};

const failure = (error: string): FileAnswer => ({ error, ok: false });

const byteLength = (text: string): number =>
  textEncoder.encode(text).byteLength;

export const parseFileRequest = (
  body: unknown
): FileRequest | "malformed" | "too-large" => {
  let encoded = "";

  try {
    const raw = JSON.stringify(body);

    if (typeof raw !== "string") return "malformed";

    encoded = raw;
  } catch {
    return "malformed";
  }

  if (encoded.length > MAX_MESSAGE_BYTES) return "too-large";
  if (typeof body !== "object" || !body || Array.isArray(body)) {
    return "malformed";
  }

  const record = body as Record<string, unknown>;
  const { name, op, text } = record;

  if (op === "list") return { op: "list" };

  if (typeof name !== "string" || typeof op !== "string") return "malformed";

  if (op === "write") {
    if (typeof text !== "string") return "malformed";

    return { name, op, text };
  }

  if (op === "read" || op === "delete" || op === "read-shared") {
    return { name, op };
  }

  return "malformed";
};

const namesIn = (files: StoredFile[], prefix: string): string[] =>
  files
    .map((file) => file.key.slice(prefix.length))
    .filter((name) => name && !name.includes("/"))
    .sort((left, right) => left.localeCompare(right));

export const runFileOp = async (
  driver: StorageDriver,
  appId: string,
  request: FileRequest,
  access: { paused: boolean; sharedRead: boolean }
): Promise<FileAnswer> => {
  if (access.paused) return failure("paused");

  if (request.op === "read-shared" && !access.sharedRead) {
    return failure("denied");
  }

  if (request.op === "list") {
    const prefix = `${STORE_PREFIX}apps/${appId}/`;
    const names = namesIn(await driver.list(prefix), prefix);

    return { names, ok: true };
  }

  const name = normalizeFileName(request.name);

  if (!name) return failure("invalid-path");

  if (request.op === "read-shared") {
    const bytes = await driver.read(sharedFileKey(name));

    if (!bytes) return failure("not-found");

    return { ok: true, text: textDecoder.decode(bytes) };
  }

  const key = appFileKey(appId, name);

  if (request.op === "read") {
    const bytes = await driver.read(key);

    if (!bytes) return failure("not-found");

    return { ok: true, text: textDecoder.decode(bytes) };
  }

  if (request.op === "delete") {
    await driver.remove(key);

    return { ok: true };
  }

  if (request.op !== "write") return failure("malformed");

  const { text } = request;

  if (byteLength(text) > MAX_FILE_BYTES) return failure("too-large");

  const appPrefix = `${STORE_PREFIX}apps/${appId}/`;
  const existing = await driver.list(appPrefix);
  const current = existing.find((file) => file.key === key);
  const nextCount = current ? existing.length : existing.length + 1;
  let used = 0;

  existing.forEach((file) => {
    if (file.key !== key) used += file.size;
  });

  const nextBytes = used + byteLength(text);

  if (nextCount > MAX_APP_FILES || nextBytes > MAX_APP_BYTES) {
    return failure("quota");
  }

  try {
    await driver.write(key, textEncoder.encode(text));
  } catch (error) {
    const quota =
      error instanceof DOMException && error.name === "QuotaExceededError";

    return failure(quota ? "quota" : "unavailable");
  }

  return { ok: true };
};

export const resetShellData = async (driver: StorageDriver): Promise<void> => {
  await driver.clear(STORE_PREFIX);
  await ensureSharedNote(driver);
};

export const fileResult = (
  id: string,
  answer: FileAnswer
): {
  error?: string;
  files?: string[];
  id: string;
  ok: boolean;
  protocol: 1;
  text?: string;
  type: "shell:result";
} => {
  if (!answer.ok) {
    return {
      error: answer.error,
      id,
      ok: false,
      protocol: 1,
      type: "shell:result",
    };
  }

  if ("names" in answer) {
    return {
      files: answer.names,
      id,
      ok: true,
      protocol: 1,
      type: "shell:result",
    };
  }

  if ("text" in answer) {
    return {
      id,
      ok: true,
      protocol: 1,
      text: answer.text,
      type: "shell:result",
    };
  }

  return { id, ok: true, protocol: 1, type: "shell:result" };
};
