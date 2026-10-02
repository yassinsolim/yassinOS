import { useEffect, useState } from "react";
import {
  decodeLayout,
  encodeLayout,
  LAYOUT_KEY,
  shouldSaveLayout,
} from "shell/layout";
import { manifestById } from "shell/manifest";
import { emptyShell, type ShellSnapshot } from "shell/model";
import {
  openShellStore,
  resetShellData,
  type StorageDriver,
} from "shell/storage";

const displaySize = (): { height: number; width: number } => ({
  height: window.innerHeight || 900,
  width: window.innerWidth || 1600,
});

export const useShellStorage = (
  paused: boolean,
  shell: ShellSnapshot,
  setShell: (value: ShellSnapshot) => void
): {
  resetLayout: () => Promise<void>;
  resetStorage: () => Promise<void>;
  store: StorageDriver | undefined;
} => {
  const [store, setStore] = useState<StorageDriver>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;

    openShellStore()
      .then(async (driver) => {
        if (cancel) return;

        setStore(driver);

        try {
          const bytes = await driver.read(LAYOUT_KEY);

          setShell(decodeLayout(bytes, displaySize(), manifestById));
        } catch {
          setShell(emptyShell());
        }

        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });

    return () => {
      cancel = true;
    };
  }, [setShell]);

  useEffect(() => {
    if (!store || !shouldSaveLayout(ready, paused)) return;

    const bytes = encodeLayout(shell);

    if (!bytes) return;

    store.write(LAYOUT_KEY, bytes).catch(() => {
      // a failed write leaves the current desktop on screen
    });
  }, [paused, ready, shell, store]);

  const resetLayout = async (): Promise<void> => {
    setShell(emptyShell());

    if (!store) return;

    try {
      await store.remove(LAYOUT_KEY);
    } catch {
      // the in-memory desktop is already clear
    }
  };

  const resetStorage = async (): Promise<void> => {
    setShell(emptyShell());

    if (!store) return;

    try {
      await resetShellData(store);
    } catch {
      // the in-memory desktop is already clear
    }
  };

  return { resetLayout, resetStorage, store };
};
