import { useEffect, useRef } from "react";
import { getProcessByFileExtension } from "components/system/Files/FileEntry/functions";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import processDirectory from "contexts/process/directory";
import { getExtension, getSearchParam } from "utils/functions";

const isBrowserUrl = (url: string): boolean =>
  url.startsWith("http://") ||
  url.startsWith("https://") ||
  url.startsWith("chrome://");

const shouldSkipAutoLaunch = (): boolean =>
  typeof window !== "undefined" &&
  "__E2E_DISABLE_AUTOLAUNCH" in window &&
  Boolean(window.__E2E_DISABLE_AUTOLAUNCH);

const useUrlLoader = (): void => {
  const { exists, fs, stat } = useFileSystem();
  const { open } = useProcesses();
  const openedInitialAppRef = useRef(false);
  const runIdRef = useRef(0);
  const unmountedRef = useRef(false);

  useEffect(() => {
    // Cleanup is inert for a run that never launched anything.
    const markUnmounted = (): void => {
      unmountedRef.current = true;
    };

    if (openedInitialAppRef.current || !fs || !exists || !open) {
      return markUnmounted;
    }

    runIdRef.current += 1;
    unmountedRef.current = false;

    const app = getSearchParam("app");
    const url = getSearchParam("url");
    const runId = runIdRef.current;
    // A newer run (StrictMode remount) or a real unmount owns the launch now.
    const isStale = (): boolean =>
      runId !== runIdRef.current || unmountedRef.current;

    const loadInitialApp = async (initialApp: string): Promise<boolean> => {
      if (!initialApp) return false;

      let urlExists = false;

      if (url) {
        try {
          urlExists =
            (initialApp === "Browser" && isBrowserUrl(url)) ||
            (await exists(url));
        } catch {
          // Ignore error checking if url exists
        }
      }

      if (isStale() || (initialApp === "FileExplorer" && url && !urlExists)) {
        return false;
      }

      open(initialApp, urlExists ? { url } : undefined);
      openedInitialAppRef.current = true;

      return true;
    };

    const loadUrl = async (): Promise<void> => {
      let openedApp = false;

      if (app) {
        const lcAppNames = Object.fromEntries(
          Object.entries(processDirectory)
            .filter(([, { dialogProcess }]) => !dialogProcess)
            .map(([name]) => [name.toLowerCase(), name])
        );

        openedApp = await loadInitialApp(lcAppNames[app.toLowerCase()]);
      } else if (url) {
        if (isBrowserUrl(url)) {
          openedApp = await loadInitialApp("Browser");
        } else {
          try {
            const stats = await stat(url);

            openedApp = await loadInitialApp(
              stats.isDirectory()
                ? "FileExplorer"
                : getProcessByFileExtension(getExtension(url))
            );
          } catch {
            // Ignore error resolving url
          }
        }
      }

      if (!openedApp && !isStale() && !shouldSkipAutoLaunch()) {
        await loadInitialApp("Portfolio");
      }
    };

    loadUrl().catch(() => {
      // Ignore error loading initial app
    });

    return () => {
      unmountedRef.current = true;
    };
  }, [exists, fs, open, stat]);
};

export default useUrlLoader;
