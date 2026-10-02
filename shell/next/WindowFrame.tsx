import { useRef } from "react";
import { MIN_HEIGHT, MIN_WIDTH, type Box } from "shell/geometry";
import AppHost from "shell/next/AppHost";
import styles from "shell/next/desktop.module.css";
import { type ShellWindow } from "shell/model";
import { type StorageDriver } from "shell/storage";

const WindowFrame = ({
  appId,
  entry,
  onClose,
  onHide,
  onNudge,
  onPlace,
  onRaise,
  paused,
  store,
}: {
  appId: string;
  entry: ShellWindow;
  onClose: (windowId: string) => void;
  onHide: (windowId: string) => void;
  onNudge: (windowId: string, key: string, shift: boolean) => void;
  onPlace: (windowId: string, box: Box) => void;
  onRaise: (windowId: string) => void;
  paused: boolean;
  store: StorageDriver | undefined;
}): React.ReactElement => {
  const titleRef = useRef<HTMLDivElement>(null);

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize"
  ): void => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    titleRef.current?.focus();
    onRaise(entry.windowId);

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

      onPlace(
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
    <div
      aria-labelledby={`title-${entry.windowId}`}
      className={styles.window}
      role="dialog"
      style={{
        height: entry.height,
        left: entry.x,
        top: entry.y,
        width: entry.width,
        zIndex: entry.z,
      }}
    >
      <div className={styles.titleRow}>
        <div
          ref={titleRef}
          aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
          className={styles.title}
          data-shell-window={entry.windowId}
          id={`title-${entry.windowId}`}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
            }
            if (!event.key.startsWith("Arrow")) return;

            event.preventDefault();
            onNudge(entry.windowId, event.key, event.shiftKey);
          }}
          onPointerDown={(event) => beginDrag(event, "move")}
          role="button"
          tabIndex={0}
        >
          {entry.title}
        </div>
        <button
          className={styles.quiet}
          onClick={() => onHide(entry.windowId)}
          type="button"
        >
          Hide
        </button>
        <button
          className={styles.quiet}
          onClick={() => onClose(entry.windowId)}
          type="button"
        >
          Close
        </button>
      </div>
      <div className={styles.body}>
        <AppHost appId={appId} paused={paused} store={store} />
      </div>
      <button
        aria-label={`Resize ${entry.title}`}
        className={styles.resize}
        onPointerDown={(event) => beginDrag(event, "resize")}
        type="button"
      />
    </div>
  );
};

export default WindowFrame;
