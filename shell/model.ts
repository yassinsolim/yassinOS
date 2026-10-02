export const SESSION_KINDS = ["local", "stream", "lab"] as const;

export type SessionKind = (typeof SESSION_KINDS)[number];

export type ShellProcess = {
  appId: string;
  processId: string;
  title: string;
};

export type ShellWindow = {
  focused: boolean;
  height: number;
  processId: string;
  title: string;
  width: number;
  windowId: string;
  x: number;
  y: number;
  z: number;
};

export type ShellDisplay = {
  displayId: string;
  height: number;
  width: number;
};

export type ShellSnapshot = {
  displays: readonly ShellDisplay[];
  processes: readonly ShellProcess[];
  session: SessionKind;
  windows: readonly ShellWindow[];
};

const MAIN_DISPLAY: ShellDisplay = {
  displayId: "main",
  height: 900,
  width: 1600,
};

export const isSessionKind = (value: string): value is SessionKind =>
  (SESSION_KINDS as readonly string[]).includes(value);

export const emptyShell = (): ShellSnapshot => ({
  displays: [MAIN_DISPLAY],
  processes: [],
  session: "local",
  windows: [],
});

export const openProcess = (
  state: ShellSnapshot,
  app: { appId: string; title: string },
  processId: string
): ShellSnapshot => {
  const process: ShellProcess = {
    appId: app.appId,
    processId,
    title: app.title,
  };
  const nextWindow: ShellWindow = {
    focused: true,
    height: 480,
    processId,
    title: app.title,
    width: 720,
    windowId: `window:${processId}`,
    x: 48 + state.windows.length * 24,
    y: 48 + state.windows.length * 24,
    z: state.windows.length + 1,
  };

  return {
    displays: state.displays,
    processes: [...state.processes, process],
    session: state.session,
    windows: [
      ...state.windows.map((entry) => ({ ...entry, focused: false })),
      nextWindow,
    ],
  };
};

export const focusWindow = (
  state: ShellSnapshot,
  windowId: string
): ShellSnapshot => ({
  ...state,
  windows: state.windows.map((entry) => ({
    ...entry,
    focused: entry.windowId === windowId,
  })),
});

export type WindowBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export const placeWindow = (
  state: ShellSnapshot,
  windowId: string,
  box: WindowBox
): ShellSnapshot => ({
  ...state,
  windows: state.windows.map((entry) =>
    entry.windowId === windowId ? { ...entry, ...box } : entry
  ),
});

export const raiseWindow = (
  state: ShellSnapshot,
  windowId: string
): ShellSnapshot => {
  const top = Math.max(0, ...state.windows.map((entry) => entry.z));

  return {
    ...state,
    windows: state.windows.map((entry) =>
      entry.windowId === windowId
        ? { ...entry, focused: true, z: top + 1 }
        : { ...entry, focused: false }
    ),
  };
};
