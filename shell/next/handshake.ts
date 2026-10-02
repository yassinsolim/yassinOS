import { useEffect } from "react";
import { FRAME_MONITOR } from "shell/manifest";
import {
  isAllowedParentOrigin,
  parseRoomParent,
  ROOM_MESSAGE,
  ROOM_PROTOCOL,
} from "shell/protocol";

export const useRoomHandshake = (
  setPaused: (paused: boolean) => void
): void => {
  useEffect(() => {
    const embedded = new URLSearchParams(window.location.search).get("embed");
    const active = window.parent !== window && embedded === "1";
    let pinned = "";
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (event.source !== window.parent) return;

      if (
        pinned ? event.origin !== pinned : !isAllowedParentOrigin(event.origin)
      ) {
        return;
      }

      const message = parseRoomParent(event.data);

      if (!message) return;

      if (message.type === ROOM_MESSAGE.HELLO) {
        pinned = event.origin;
        window.parent.postMessage(
          { protocol: ROOM_PROTOCOL, type: ROOM_MESSAGE.READY },
          event.origin
        );
        window.parent.postMessage(
          {
            apps: [FRAME_MONITOR.appId],
            focused: FRAME_MONITOR.appId,
            type: ROOM_MESSAGE.STATE,
          },
          event.origin
        );
      } else if (message.type === ROOM_MESSAGE.PAUSE) {
        setPaused(true);
      } else if (message.type === ROOM_MESSAGE.RESUME) {
        setPaused(false);
      }
    };

    if (active) window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [setPaused]);
};
