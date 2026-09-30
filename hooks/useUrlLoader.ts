import { useEffect, useRef } from "react";
import { getProcessByFileExtension } from "components/system/Files/FileEntry/functions";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import processDirectory from "contexts/process/directory";
import { isMainDisplay } from "utils/embed";
import { getExtension, getSearchParam } from "utils/functions";

const isBrowserUrl = (url: string): boolean =>
  url.startsWith("http://") ||
  url.startsWith("https://") ||
  url.startsWith("chrome://");

// the room's main screen starts on a clean desktop, its parent opens apps
const shouldSkipAutoLaunch = (): boolean =>
  typeof window !== "undefined" &&
  (("__E2E_DISABLE_AUTOLAUNCH" in window &&
    Boolean(window.__E2E_DISABLE_AUTOLAUNCH)) ||
    isMainDisplay());

// an app name the way ?app= takes it (any case), dialogs excluded
export const resolveAppName = (app: string): string | undefined =>
  Object.keys(processDirectory).find(
    (name) =>
      !processDirectory[name].dialogProcess &&
      name.toLowerCase() === app.toLowerCase()
  );

type AppOpener = {
  exists: (path: string) => Promise<boolean>;
  open: ReturnType<typeof useProcesses>["open"];
};

// opens a process like ?app= does: the url is only passed on if it exists (or
// is a web url for the Browser), and File Explorer needs one that exists
export const openApp = async (
  processId: string,
  url: string,
  { exists, open }: AppOpener,
  isStale: () => boolean = () => false
): Promise<boolean> => {
  let urlExists = false;

  if (url) {
    try {
      urlExists =
        (processId === "Browser" && isBrowserUrl(url)) || (await exists(url));
    } catch {
      // Ignore error checking if url exists
    }
  }

  if (isStale() || (processId === "FileExplorer" && url && !urlExists)) {
    return false;
  }

  open(processId, urlExists ? { url } : undefined);

  return true;
};

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

    const loadInitialApp = async (initialApp?: string): Promise<boolean> => {
      if (!initialApp) return false;

      const opened = await openApp(initialApp, url, { exists, open }, isStale);

      if (opened) openedInitialAppRef.current = true;

      return opened;
    };

    const loadUrl = async (): Promise<void> => {
      let openedApp = false;

      if (app) {
        openedApp = await loadInitialApp(resolveAppName(app));
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
