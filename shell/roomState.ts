import { type ShellSnapshot } from "shell/model";
import { ROOM_MESSAGE, type RoomParentMessage } from "shell/protocol";

export const applyRoomControl = (
  paused: boolean,
  message: RoomParentMessage | undefined
): boolean => {
  if (message?.type === ROOM_MESSAGE.PAUSE) return true;
  if (message?.type === ROOM_MESSAGE.RESUME) return false;

  return paused;
};

export const roomState = (
  state: ShellSnapshot
): {
  apps: string[];
  focused: string | null;
  type: typeof ROOM_MESSAGE.STATE;
} => {
  const focusedWindow = state.windows.find(
    (entry) => entry.focused && !entry.minimized
  );
  const focusedProcess = focusedWindow
    ? state.processes.find(
        (process) => process.processId === focusedWindow.processId
      )
    : undefined;
  const apps: string[] = [];

  state.processes.forEach((process) => {
    if (!apps.includes(process.appId)) apps.push(process.appId);
  });

  return {
    apps,
    // the room protocol uses null when nothing is focused
    // eslint-disable-next-line unicorn/no-null
    focused: focusedProcess ? focusedProcess.appId : null,
    type: ROOM_MESSAGE.STATE,
  };
};
