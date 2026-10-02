import { useCallback, useEffect, useRef, useState } from "react";
import { clampBox, nudgeBox, type Box } from "shell/geometry";
import { APP_REGISTRY, manifestById } from "shell/manifest";
import {
  closeWindow,
  emptyShell,
  minimizeWindow,
  nextProcessId,
  openProcess,
  placeWindow,
  raiseWindow,
  restoreWindow,
  type ShellSnapshot,
} from "shell/model";
import styles from "shell/next/desktop.module.css";
import { useRoomHandshake } from "shell/next/handshake";
import { useShellStorage } from "shell/next/useShellStorage";
import WindowFrame from "shell/next/WindowFrame";

const NextDesktop = (): React.ReactElement => {
  const [shell, setShell] = useState<ShellSnapshot>(emptyShell);
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState<"layout" | "none" | "storage">("none");
  const surface = useRef<HTMLDivElement>(null);
  const focusedId = shell.windows.find((entry) => entry.focused)?.windowId;
  const { resetLayout, resetStorage, store } = useShellStorage(
    paused,
    shell,
    setShell
  );

  useRoomHandshake(shell, setPaused);

  useEffect(() => {
    if (!focusedId) return;

    const title = document.querySelector(`[data-shell-window="${focusedId}"]`);

    if (title instanceof HTMLElement) title.focus();
  }, [focusedId]);

  const launch = (appId: string): void => {
    const manifest = manifestById(appId);

    if (!manifest) return;

    setShell((current) =>
      openProcess(
        current,
        {
          appId: manifest.appId,
          height: manifest.height,
          title: manifest.title,
          width: manifest.width,
        },
        nextProcessId(current, manifest.appId)
      )
    );
  };

  const place = useCallback((windowId: string, box: Box): void => {
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

  const nudge = (windowId: string, key: string, shift: boolean): void => {
    const entry = shell.windows.find((item) => item.windowId === windowId);

    if (!entry) return;

    const bounds = surface.current?.getBoundingClientRect();
    const nudged = nudgeBox(entry, key, shift);
    const next = bounds
      ? clampBox(nudged, { height: bounds.height, width: bounds.width })
      : nudged;

    setShell((current) => placeWindow(current, windowId, next));
  };

  return (
    <main className={styles.root}>
      <div className={styles.bar}>
        <ul className={styles.sessions}>
          <li className={styles.current}>Local</li>
          <li className={styles.unavailable}>Stream, unavailable</li>
          <li className={styles.unavailable}>Lab, unavailable</li>
        </ul>
        <ul className={styles.launch}>
          {APP_REGISTRY.map((app) => (
            <li key={app.appId}>
              <button onClick={() => launch(app.appId)} type="button">
                <span aria-hidden="true">{app.icon}</span> {app.title}
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Arrow keys move the focused window. Shift and an arrow key resizes it.
        </p>
        {confirm === "none" ? (
          <>
            <button
              className={styles.quiet}
              onClick={() => setConfirm("layout")}
              type="button"
            >
              Reset layout
            </button>
            <button
              className={styles.quiet}
              onClick={() => setConfirm("storage")}
              type="button"
            >
              Reset storage
            </button>
          </>
        ) : (
          <>
            <p className={styles.note}>
              {confirm === "layout"
                ? "Clear the saved window layout?"
                : "Delete shell files and the saved layout?"}
            </p>
            <button
              className={styles.quiet}
              onClick={() => {
                const run = confirm === "layout" ? resetLayout : resetStorage;

                setConfirm("none");
                run().catch(() => {
                  // the desktop is already clear
                });
              }}
              type="button"
            >
              Confirm reset
            </button>
            <button
              className={styles.quiet}
              onClick={() => setConfirm("none")}
              type="button"
            >
              Cancel
            </button>
          </>
        )}
      </div>
      {shell.windows.length > 0 && (
        <ul className={styles.tasks}>
          {shell.windows.map((entry) => (
            <li key={entry.windowId}>
              <button
                aria-pressed={!entry.minimized}
                onClick={() =>
                  setShell((current) =>
                    entry.minimized
                      ? restoreWindow(current, entry.windowId)
                      : raiseWindow(current, entry.windowId)
                  )
                }
                type="button"
              >
                {entry.title}
                {entry.minimized ? ", hidden" : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={surface} className={styles.surface}>
        {shell.windows.flatMap((entry) => {
          if (entry.minimized) return [];

          const process = shell.processes.find(
            (item) => item.processId === entry.processId
          );

          if (!process) return [];

          return [
            <WindowFrame
              key={entry.windowId}
              appId={process.appId}
              entry={entry}
              onClose={(windowId) =>
                setShell((current) => closeWindow(current, windowId))
              }
              onHide={(windowId) =>
                setShell((current) => minimizeWindow(current, windowId))
              }
              onNudge={nudge}
              onPlace={place}
              onRaise={(windowId) =>
                setShell((current) => raiseWindow(current, windowId))
              }
              paused={paused}
              store={store}
            />,
          ];
        })}
      </div>
    </main>
  );
};

export default NextDesktop;
