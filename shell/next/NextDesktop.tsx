import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampBox,
  MIN_HEIGHT,
  MIN_WIDTH,
  nudgeBox,
  type Box,
} from "shell/geometry";
import { FRAME_MONITOR } from "shell/manifest";
import {
  emptyShell,
  openProcess,
  placeWindow,
  raiseWindow,
  type ShellSnapshot,
  type ShellWindow,
} from "shell/model";
import FrameMonitor from "shell/next/FrameMonitor";
import styles from "shell/next/desktop.module.css";
import { useRoomHandshake } from "shell/next/handshake";

const boot = (): ShellSnapshot => {
  const opened = openProcess(
    emptyShell(),
    { appId: FRAME_MONITOR.appId, title: FRAME_MONITOR.title },
    FRAME_MONITOR.appId
  );
  const entry = opened.windows[0];

  if (!entry) return opened;

  return placeWindow(opened, entry.windowId, {
    height: FRAME_MONITOR.height,
    width: FRAME_MONITOR.width,
    x: entry.x,
    y: entry.y,
  });
};

const NextDesktop = (): React.ReactElement => {
  const [shell, setShell] = useState(boot);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const frame = shell.windows[0];

  useRoomHandshake(setPaused);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (): void => setReduceMotion(media.matches);

    apply();
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    windowRef.current?.focus();
  }, []);

  const move = useCallback((windowId: string, box: Box): void => {
    setShell((current) => {
      const bounds = surface.current?.getBoundingClientRect();
      const display = bounds
        ? { height: bounds.height, width: bounds.width }
        : current.displays[0];

      return display
        ? placeWindow(current, windowId, clampBox(box, display))
        : placeWindow(current, windowId, box);
    });
  }, []);

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize",
    entry: ShellWindow
  ): void => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    windowRef.current?.focus();
    setShell((current) => raiseWindow(current, entry.windowId));

    const originX = event.clientX;
    const originY = event.clientY;
    const start = {
      height: entry.height,
      width: entry.width,
      x: entry.x,
      y: entry.y,
    };
    const handle = event.currentTarget;
    const onMove = (moveEvent: PointerEvent): void => {
      const dx = moveEvent.clientX - originX;
      const dy = moveEvent.clientY - originY;

      move(
        entry.windowId,
        mode === "move"
          ? { ...start, x: start.x + dx, y: start.y + dy }
          : {
              ...start,
              height: Math.max(MIN_HEIGHT, start.height + dy),
              width: Math.max(MIN_WIDTH, start.width + dx),
            }
      );
    };
    const onUp = (): void => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  };

  return (
    <main className={styles.root}>
      <div className={styles.bar}>
        <ul className={styles.sessions}>
          <li className={styles.current}>Local</li>
          <li className={styles.unavailable}>Stream, unavailable</li>
          <li className={styles.unavailable}>Lab, unavailable</li>
        </ul>
        <p className={styles.note}>One window on the local session.</p>
      </div>
      <div ref={surface} className={styles.surface}>
        {frame && (
          <div
            aria-labelledby="frame-title"
            className={styles.window}
            role="dialog"
            style={{
              height: frame.height,
              left: frame.x,
              top: frame.y,
              width: frame.width,
              zIndex: frame.z,
            }}
          >
            <div
              ref={windowRef}
              aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
              className={styles.title}
              id="frame-title"
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                }
                if (!event.key.startsWith("Arrow")) return;

                event.preventDefault();
                const bounds = surface.current?.getBoundingClientRect();
                const nudged = nudgeBox(frame, event.key, event.shiftKey);
                const next = bounds
                  ? clampBox(nudged, {
                      height: bounds.height,
                      width: bounds.width,
                    })
                  : nudged;

                setShell((current) =>
                  placeWindow(current, frame.windowId, next)
                );
              }}
              onPointerDown={(event) => beginDrag(event, "move", frame)}
              role="button"
              tabIndex={0}
            >
              {frame.title}
            </div>
            <div className={styles.body}>
              <FrameMonitor paused={paused} reduceMotion={reduceMotion} />
              <p className={styles.hint}>
                Arrow keys move the window. Shift and an arrow key resizes it.
              </p>
            </div>
            <button
              aria-label="Resize frame time"
              className={styles.resize}
              onPointerDown={(event) => beginDrag(event, "resize", frame)}
              type="button"
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default NextDesktop;
