import { useCallback, useEffect, useRef, useState } from "react";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import { useSession } from "contexts/session";
import { useProcessesRef } from "hooks/useProcessesRef";
import { openApp, resolveAppName } from "hooks/useUrlLoader";
import { isSpanWallpaper, loadSpanWallpaper } from "utils/embed";
import {
  EMBED_PROTOCOL,
  MESSAGE,
  createInputReporter,
  getParentOrigin,
  isBridgeEnabled,
  isUnclaimedEscape,
  postToParent,
  readParentMessage,
  setParentOrigin,
  setParentPaused,
  summarizeState,
  takeEarlyHello,
} from "utils/embedBridge";
import { PROCESS_DELIMITER } from "utils/constants";

const DRAWN_POLL_MS = 100;
const DRAWN_TIMEOUT_MS = 8000;
const PAINT_FALLBACK_MS = 250;
const STATE_DEBOUNCE_MS = 150;

// the desktop's first full frame: the taskbar with its clock, and the
// desktop icons with their images
const desktopIsDrawn = (): boolean =>
  Boolean(
    document.querySelector("main > nav:not([style]) [role=timer]") &&
      document.querySelector("main > ol > li")
  ) &&
  [...document.querySelectorAll<HTMLImageElement>("main > ol > li img")].every(
    ({ complete }) => complete
  );

const waitUntilDrawn = (onDrawn: () => void): (() => void) => {
  const deadline = Date.now() + DRAWN_TIMEOUT_MS;
  let timer = 0;
  const check = (): void => {
    if (desktopIsDrawn() || Date.now() > deadline) onDrawn();
    else timer = window.setTimeout(check, DRAWN_POLL_MS);
  };

  check();

  return () => window.clearTimeout(timer);
};

// two frames later it's on screen. a hidden or throttled frame may never get
// there, so don't wait forever
const nextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    const fallback = window.setTimeout(resolve, PAINT_FALLBACK_MS);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.clearTimeout(fallback);
        resolve();
      })
    );
  });

const useEmbedBridge = (): void => {
  const { exists } = useFileSystem();
  const { minimize, open, processes } = useProcesses();
  const { foregroundId, sessionLoaded, setForegroundId } = useSession();
  const processesRef = useProcessesRef();
  const foregroundIdRef = useRef(foregroundId);
  const lastStateRef = useRef("");
  const [painted, setPainted] = useState(false);
  const [hellos, setHellos] = useState(0);
  // counts up with every hello answered, 0 until the desktop has painted
  const readyCount = painted ? hellos : 0;

  const openFromParent = useCallback(
    (app: string, url = ""): void => {
      const processId = resolveAppName(app);

      if (!processId) return;

      // already open (with that url, if one was asked for): bring it forward
      const [openPid] =
        Object.entries(processesRef.current).find(
          ([pid, { closing, url: processUrl = "" }]) =>
            !closing &&
            pid.split(PROCESS_DELIMITER)[0] === processId &&
            (!url || processUrl === url)
        ) || [];

      if (openPid) {
        if (processesRef.current[openPid].minimized) minimize(openPid);
        setForegroundId(openPid);
      } else {
        openApp(processId, url, { exists, open }).catch(() => {
          // an app that fails to open just stays closed
        });
      }
    },
    [exists, minimize, open, processesRef, setForegroundId]
  );

  useEffect(() => {
    foregroundIdRef.current = foregroundId;
  }, [foregroundId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      const message = readParentMessage(event, {
        parent: window.parent,
        pinnedOrigin: getParentOrigin(),
      });

      if (!message) return;

      if (message.type === MESSAGE.HELLO) {
        setParentOrigin(event.origin);
        setHellos((count) => count + 1);
      } else if (message.type === MESSAGE.OPEN) {
        openFromParent(message.app, message.url);
      } else {
        setParentPaused(message.type === MESSAGE.PAUSE);
      }
    };

    if (isBridgeEnabled()) {
      const earlyHello = takeEarlyHello();

      if (earlyHello) onMessage(earlyHello);
      window.addEventListener("message", onMessage);
    }

    return () => window.removeEventListener("message", onMessage);
  }, [openFromParent]);

  useEffect(() => {
    let cancelled = false;
    const stopWaiting =
      sessionLoaded && isBridgeEnabled()
        ? waitUntilDrawn(() =>
            (isSpanWallpaper() ? loadSpanWallpaper() : Promise.resolve())
              .then(nextPaint)
              .then(() => {
                if (!cancelled) setPainted(true);
              })
          )
        : undefined;

    return () => {
      cancelled = true;
      stopWaiting?.();
    };
  }, [sessionLoaded]);

  useEffect(() => {
    if (!readyCount) return;

    // every ready is followed by a fresh state
    lastStateRef.current = "";
    postToParent({ protocol: EMBED_PROTOCOL, type: MESSAGE.READY });
  }, [readyCount]);

  useEffect(() => {
    const timer = readyCount
      ? window.setTimeout(() => {
          const state = summarizeState(processes, foregroundId);
          const stateKey = JSON.stringify(state);

          if (
            stateKey !== lastStateRef.current &&
            postToParent({ ...state, type: MESSAGE.STATE })
          ) {
            lastStateRef.current = stateKey;
          }
        }, STATE_DEBOUNCE_MS)
      : 0;

    return () => window.clearTimeout(timer);
  }, [foregroundId, processes, readyCount]);

  useEffect(() => {
    const enabled = isBridgeEnabled();
    const input = createInputReporter((kind) =>
      postToParent({ kind, type: MESSAGE.INPUT })
    );
    let unclaimedEscape: KeyboardEvent | undefined;
    // capture runs before anything in yassinOS sees the key, so menus that
    // close on escape are still open here
    const onKeyDownCapture = (event: KeyboardEvent): void => {
      input.keyDown(event);
      unclaimedEscape = isUnclaimedEscape(
        event,
        Boolean(processesRef.current[foregroundIdRef.current]?.dialogProcess)
      )
        ? event
        : undefined;
    };
    // and if it bubbles back up without being prevented, nobody used it
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event === unclaimedEscape && !event.defaultPrevented) {
        postToParent({ type: MESSAGE.ESCAPE });
      }

      unclaimedEscape = undefined;
    };
    const onPointerDown = (): void => input.pointer("pointerdown");
    const onPointerUp = (): void => input.pointer("pointerup");
    const captureOptions = { capture: true, passive: true };

    if (enabled) {
      window.addEventListener("keydown", onKeyDownCapture, captureOptions);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", input.keyUp, captureOptions);
      window.addEventListener("pointerdown", onPointerDown, captureOptions);
      window.addEventListener("pointerup", onPointerUp, captureOptions);
      window.addEventListener("blur", input.reset, { passive: true });
    }

    return () => {
      window.removeEventListener("keydown", onKeyDownCapture, captureOptions);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", input.keyUp, captureOptions);
      window.removeEventListener("pointerdown", onPointerDown, captureOptions);
      window.removeEventListener("pointerup", onPointerUp, captureOptions);
      window.removeEventListener("blur", input.reset);
    };
  }, [processesRef]);
};

export default useEmbedBridge;
