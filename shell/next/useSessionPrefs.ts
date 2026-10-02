import { useEffect, useRef, useState } from "react";
import {
  decodePreferences,
  emptyPreferences,
  encodePreferences,
  SESSION_PREF_KEY,
  type SessionPreferences,
} from "shell/session";
import { openShellStore, type StorageDriver } from "shell/storage";

export const useSessionPrefs = (): {
  prefs: SessionPreferences;
  save: (next: SessionPreferences) => void;
} => {
  const [prefs, setPrefs] = useState(emptyPreferences);
  const [store, setStore] = useState<StorageDriver>();
  const pendingRef = useRef<{ prefs?: SessionPreferences }>({});

  useEffect(() => {
    let cancel = false;

    openShellStore()
      .then(async (driver) => {
        if (cancel) return;

        setStore(driver);

        if (pendingRef.current.prefs) {
          const bytes = encodePreferences(pendingRef.current.prefs);

          if (bytes) await driver.write(SESSION_PREF_KEY, bytes);

          return;
        }

        try {
          setPrefs(decodePreferences(await driver.read(SESSION_PREF_KEY)));
        } catch {
          setPrefs(emptyPreferences());
        }
      })
      .catch(() => {
        // the picker still opens when storage fails
      });

    return () => {
      cancel = true;
    };
  }, []);

  const save = (next: SessionPreferences): void => {
    pendingRef.current.prefs = next;
    setPrefs(next);

    const bytes = encodePreferences(next);

    if (!store || !bytes) return;

    store.write(SESSION_PREF_KEY, bytes).catch(() => {
      // the choice still applies for this visit
    });
  };

  return { prefs, save };
};
