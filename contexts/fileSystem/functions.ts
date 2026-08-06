import { join } from "path";
import type IndexedDBFileSystem from "browserfs/dist/node/backend/IndexedDB";
import type OverlayFS from "browserfs/dist/node/backend/OverlayFS";
import type InMemoryFileSystem from "browserfs/dist/node/backend/InMemory";
import { type FileSystemObserver } from "contexts/fileSystem/useFileSystemContextState";
import { FS_HANDLES } from "utils/constants";
import { type RootFileSystem } from "contexts/fileSystem/useAsyncFs";
import {
  KEYVAL_STORE_NAME,
  getFileSystemHandles,
  getKeyValStore,
  supportsIndexedDB,
} from "contexts/fileSystem/core";

const KNOWN_IDB_DBS = [
  "/classicube",
  "/data/saves",
  "ejs-bios",
  "ejs-roms",
  "ejs-romsdata",
  "ejs-states",
  "ejs-system",
  "js-dos-cache (emulators-ui-saves)",
  "keyval-store",
];

const observers = new Map<string, FileSystemObserver>();

export const addFileSystemHandle = async (
  directory: string,
  handle: FileSystemDirectoryHandle,
  mappedName: string,
  observer?: FileSystemObserver
): Promise<void> => {
  const dirPath = join(directory, mappedName);
  if (observer) {
    observers.get(dirPath)?.disconnect();
    observers.set(dirPath, observer);
  }

  try {
    if (!(await supportsIndexedDB())) return;

    const db = await getKeyValStore();

    await db.put(
      KEYVAL_STORE_NAME,
      {
        ...(await getFileSystemHandles()),
        [dirPath]: handle,
      },
      FS_HANDLES
    );
  } catch {
    // Ignore errors storing handle
  }
};

export const removeFileSystemHandle = async (
  directory: string
): Promise<void> => {
  try {
    if (!(await supportsIndexedDB())) return;

    const { [directory]: _removedHandle, ...handles } =
      await getFileSystemHandles();
    const db = await getKeyValStore();

    await db.put(KEYVAL_STORE_NAME, handles, FS_HANDLES);
  } catch {
    // Ignore errors storing handle
  } finally {
    observers.get(directory)?.disconnect();
    observers.delete(directory);
  }
};

export const requestPermission = async (
  url: string
): Promise<PermissionState | false> => {
  const fsHandles = await getFileSystemHandles();
  const handle = fsHandles[url];

  if (handle) {
    const fsHandle = handle as {
      queryPermission?: () => Promise<PermissionState>;
      requestPermission?: () => Promise<PermissionState>;
    };
    const currentPermissions = (await fsHandle.queryPermission?.()) ?? "prompt";

    if (currentPermissions === "prompt") {
      await fsHandle.requestPermission?.();
    } else if (currentPermissions === "granted") {
      throw new Error("Permission already granted");
    }

    return fsHandle.queryPermission ? fsHandle.queryPermission() : false;
  }

  return false;
};

export const resetStorage = (rootFs?: RootFileSystem): Promise<void> =>
  new Promise((resolve, reject) => {
    setTimeout(reject, 750);

    window.localStorage.clear();
    window.sessionStorage.clear();

    const clearFs = (): void => {
      const overlayFs = rootFs?._getFs("/")?.fs as OverlayFS;
      const overlayedFileSystems = overlayFs?.getOverlayedFileSystems();
      const readable = overlayedFileSystems?.readable as
        | { empty?: () => void }
        | undefined;
      const writable = overlayedFileSystems?.writable as
        | IndexedDBFileSystem
        | InMemoryFileSystem;

      readable?.empty?.();

      if (writable?.getName() === "InMemory" || !writable?.empty) {
        resolve();
      } else {
        writable.empty((apiError) => (apiError ? reject(apiError) : resolve()));
      }
    };

    if (window.indexedDB) {
      import("idb")
        .then(({ deleteDB }) => {
          if (window.indexedDB.databases) {
            window.indexedDB
              .databases()
              .then((databases) =>
                databases
                  .filter(({ name }) => name && name !== "browserfs")
                  .forEach(({ name }) => deleteDB(name as string))
              )
              .then(clearFs)
              .catch(clearFs);
          } else {
            KNOWN_IDB_DBS.forEach((name) => deleteDB(name));
            clearFs();
          }
        })
        .catch(clearFs);
    } else {
      clearFs();
    }
  });
