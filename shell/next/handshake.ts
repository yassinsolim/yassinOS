import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { type ShellSnapshot } from "shell/model";
import {
  isAllowedParentOrigin,
  parseRoomParent,
  ROOM_MESSAGE,
  ROOM_PROTOCOL,
} from "shell/protocol";
import { applyRoomControl, roomState } from "shell/roomState";

export const useRoomHandshake = (
  shell: ShellSnapshot,
  setPaused: Dispatch<SetStateAction<boolean>>
): void => {
  const shellRef = useRef(shell);
  const pinnedRef = useRef("");

  shellRef.current = shell;

  useEffect(() => {
    const embedded = new URLSearchParams(window.location.search).get("embed");
    const active = window.parent !== window && embedded === "1";
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (event.source !== window.parent) return;

      if (
        pinnedRef.current
          ? event.origin !== pinnedRef.current
          : !isAllowedParentOrigin(event.origin)
      ) {
        return;
      }

      const message = parseRoomParent(event.data);

      if (!message) return;

      if (message.type === ROOM_MESSAGE.HELLO) {
        pinnedRef.current = event.origin;
        window.parent.postMessage(
          { protocol: ROOM_PROTOCOL, type: ROOM_MESSAGE.READY },
          event.origin
        );
        window.parent.postMessage(roomState(shellRef.current), event.origin);
        return;
      }

      setPaused((current) => applyRoomControl(current, message));
    };

    if (active) window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [setPaused]);

  useEffect(() => {
    if (!pinnedRef.current || window.parent === window) return;

    window.parent.postMessage(roomState(shell), pinnedRef.current);
  }, [shell]);
};
