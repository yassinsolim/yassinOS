import { readFileSync } from "node:fs";
import path from "node:path";
import { authorizeGuest, OPAQUE_ORIGIN } from "shell/sandbox";
import {
  appFileKey,
  MAX_APP_BYTES,
  MAX_APP_FILES,
  MAX_FILE_BYTES,
  MAX_MESSAGE_BYTES,
  memoryDriver,
  normalizeFileName,
  openShellStore,
  opfsDriver,
  parseFileRequest,
  resetShellData,
  runFileOp,
  selectStoreKind,
  SHARED_NOTE,
  SHELL_DATABASE,
} from "shell/storage";

const frame = { id: "guest" };

const access = { paused: false, sharedRead: true };

describe("shell file names", () => {
  test("rejects traversal and normalizes a plain name", () => {
    expect(normalizeFileName("note.txt")).toBe("note.txt");
    expect(normalizeFileName("../note.txt")).toBeUndefined();
    expect(normalizeFileName(String.raw`..\note.txt`)).toBeUndefined();
    expect(normalizeFileName("/etc/passwd")).toBeUndefined();
    expect(normalizeFileName("note/../../secret")).toBeUndefined();
    expect(normalizeFileName("..")).toBeUndefined();
    expect(normalizeFileName(".hidden")).toBeUndefined();
    expect(normalizeFileName("a\0b")).toBeUndefined();
  });
});

describe("per-app files", () => {
  test("keeps apps apart and blocks a shared write", async () => {
    const driver = memoryDriver();

    expect(
      await runFileOp(
        driver,
        "files",
        { name: "note.txt", op: "write", text: "hello" },
        access
      )
    ).toEqual({ ok: true });
    expect(
      await runFileOp(driver, "frame-monitor", { op: "list" }, access)
    ).toEqual({ names: [], ok: true });
    expect(
      await runFileOp(
        driver,
        "frame-monitor",
        { name: "note.txt", op: "read" },
        access
      )
    ).toEqual({ error: "not-found", ok: false });
    expect(
      await runFileOp(
        driver,
        "files",
        { name: "../layout.json", op: "read" },
        access
      )
    ).toEqual({ error: "invalid-path", ok: false });
    expect(
      await runFileOp(
        driver,
        "files",
        { name: "readme.txt", op: "read-shared" },
        { paused: false, sharedRead: false }
      )
    ).toEqual({ error: "denied", ok: false });
    expect(
      await runFileOp(
        driver,
        "files",
        { name: "note.txt", op: "write", text: "x" },
        { paused: true, sharedRead: true }
      )
    ).toEqual({ error: "paused", ok: false });
  });

  test("enforces size and count quotas", async () => {
    const driver = memoryDriver();
    const full = "a".repeat(MAX_FILE_BYTES);

    expect(
      await runFileOp(
        driver,
        "files",
        { name: "big.txt", op: "write", text: `${full}b` },
        access
      )
    ).toEqual({ error: "too-large", ok: false });

    const encoder = new TextEncoder();

    await Promise.all(
      Array.from({ length: MAX_APP_FILES }, (_item, index) =>
        driver.write(appFileKey("files", `n${index}.txt`), encoder.encode("a"))
      )
    );

    expect(
      await runFileOp(
        driver,
        "files",
        { name: "overflow.txt", op: "write", text: "a" },
        access
      )
    ).toEqual({ error: "quota", ok: false });

    const wide = memoryDriver();
    const chunk = "b".repeat(MAX_FILE_BYTES);
    const chunks = Math.floor(MAX_APP_BYTES / MAX_FILE_BYTES);

    await Promise.all(
      Array.from({ length: chunks }, (_item, index) =>
        wide.write(appFileKey("files", `c${index}.txt`), encoder.encode(chunk))
      )
    );

    expect(
      await runFileOp(
        wide,
        "files",
        { name: "extra.txt", op: "write", text: "b" },
        access
      )
    ).toEqual({ error: "quota", ok: false });
  });

  test("uses OPFS when it exists and otherwise falls back", async () => {
    expect(selectStoreKind({ idb: true, opfs: true })).toBe("opfs");
    expect(selectStoreKind({ idb: true, opfs: false })).toBe("indexeddb");
    expect(selectStoreKind({ idb: false, opfs: false })).toBe("memory");

    const files = new Map<string, Uint8Array>();
    const directory = {
      entries: (): AsyncIterable<[string, unknown]> => ({
        [Symbol.asyncIterator]() {
          const names = [...files.keys()];
          let index = 0;

          return {
            next: (): Promise<IteratorResult<[string, unknown]>> => {
              if (index >= names.length) {
                return Promise.resolve({ done: true, value: ["", ""] });
              }

              const name = names[index] ?? "";

              index += 1;

              return Promise.resolve({
                done: false,
                value: [name, name],
              });
            },
          };
        },
      }),
      getFileHandle: (name: string, options: { create: boolean }) => {
        if (!files.has(name) && !options.create) {
          return Promise.reject(new Error("missing"));
        }

        return Promise.resolve({
          createWritable: () =>
            Promise.resolve({
              close: () => Promise.resolve(),
              write: (data: Uint8Array) => {
                const copy = new Uint8Array(data.byteLength);

                copy.set(data);
                files.set(name, copy);

                return Promise.resolve();
              },
            }),
          getFile: () => {
            const stored = files.get(name);
            const buffer = new ArrayBuffer(stored ? stored.byteLength : 0);

            if (stored) new Uint8Array(buffer).set(stored);

            return Promise.resolve({
              arrayBuffer: () => Promise.resolve(buffer),
            });
          },
        });
      },
      removeEntry: (name: string) => {
        files.delete(name);

        return Promise.resolve();
      },
    };
    const driver = opfsDriver(directory);

    expect(
      await runFileOp(
        driver,
        "files",
        { name: "note.txt", op: "write", text: "opfs" },
        access
      )
    ).toEqual({ ok: true });
    expect(
      await runFileOp(driver, "files", { name: "note.txt", op: "read" }, access)
    ).toEqual({ ok: true, text: "opfs" });

    await resetShellData(driver);
    expect(await runFileOp(driver, "files", { op: "list" }, access)).toEqual({
      names: [],
      ok: true,
    });
    expect(
      await runFileOp(
        driver,
        "files",
        { name: "readme.txt", op: "read-shared" },
        access
      )
    ).toEqual({ ok: true, text: SHARED_NOTE });
  });

  test("drops a huge file message and keeps daedalOS storage alone", () => {
    const body = {
      name: "note.txt",
      op: "write",
      text: "a".repeat(MAX_MESSAGE_BYTES),
    };

    expect(parseFileRequest(body)).toBe("too-large");
    expect(parseFileRequest({ op: "nope" })).toBe("malformed");
    expect(parseFileRequest(Symbol("missing"))).toBe("malformed");
    expect(
      authorizeGuest(
        {
          body,
          capability: "files",
          id: "run-1",
          protocol: 1,
          type: "shell:request",
        },
        { origin: OPAQUE_ORIGIN, source: frame },
        { appId: "files", contentWindow: frame, granted: ["files"] }
      )
    ).toEqual({ kind: "drop", reason: "schema" });
    expect(
      readFileSync(path.join(process.cwd(), "shell/storage.ts"), "utf8")
    ).not.toMatch(/BrowserFS|daedalOS/);
    expect(SHELL_DATABASE).toBe("yassinos-shell");
  });

  test("falls back to memory when the private file system throws", async () => {
    const storage = Object.getOwnPropertyDescriptor(navigator, "storage");

    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        getDirectory: () => Promise.reject(new Error("opfs unavailable")),
      },
    });

    try {
      const driver = await openShellStore();

      expect(
        await runFileOp(
          driver,
          "files",
          { name: "note.txt", op: "write", text: "memory" },
          access
        )
      ).toEqual({ ok: true });
    } finally {
      if (storage) Object.defineProperty(navigator, "storage", storage);
    }
  });
});
