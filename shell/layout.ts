import { clampBox, MIN_HEIGHT, MIN_WIDTH } from "shell/geometry";
import { type AppManifest } from "shell/manifest";
import {
  emptyShell,
  type ShellProcess,
  type ShellSnapshot,
  type ShellWindow,
} from "shell/model";
import { STORE_PREFIX } from "shell/storage";

export const LAYOUT_VERSION = 1;
export const LAYOUT_KEY = `${STORE_PREFIX}layout.json`;
export const MAX_LAYOUT_BYTES = 32768;

export type LayoutFile = {
  version: typeof LAYOUT_VERSION;
  windows: {
    appId: string;
    focused: boolean;
    height: number;
    minimized: boolean;
    processId: string;
    width: number;
    x: number;
    y: number;
    z: number;
  }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const shouldSaveLayout = (ready: boolean, paused: boolean): boolean =>
  ready && !paused;

const focusWindows = (windows: ShellWindow[]): ShellWindow[] => {
  let topId = "";
  let topZ = -1;
  let markedId = "";
  let markedZ = -1;

  windows.forEach((entry) => {
    if (entry.minimized) return;

    if (entry.z > topZ) {
      topZ = entry.z;
      topId = entry.windowId;
    }

    if (entry.focused && entry.z > markedZ) {
      markedZ = entry.z;
      markedId = entry.windowId;
    }
  });

  const chosen = markedId || topId;

  return windows.map((entry) => ({
    ...entry,
    focused: chosen !== "" && entry.windowId === chosen,
  }));
};

export const captureLayout = (state: ShellSnapshot): LayoutFile => ({
  version: LAYOUT_VERSION,
  windows: state.windows.flatMap((entry) => {
    const process = state.processes.find(
      (item) => item.processId === entry.processId
    );

    if (!process) return [];

    return [
      {
        appId: process.appId,
        focused: entry.focused,
        height: entry.height,
        minimized: entry.minimized,
        processId: entry.processId,
        width: entry.width,
        x: entry.x,
        y: entry.y,
        z: entry.z,
      },
    ];
  }),
});

export const restoreLayout = (
  raw: unknown,
  display: { height: number; width: number },
  lookup: (appId: string) => AppManifest | undefined
): ShellSnapshot => {
  const shell = emptyShell();

  if (!isRecord(raw) || raw.version !== LAYOUT_VERSION) return shell;
  if (!Array.isArray(raw.windows)) return shell;

  const processes: ShellProcess[] = [];
  const windows: ShellWindow[] = [];
  const seen = new Set<string>();

  raw.windows.forEach((item) => {
    if (!isRecord(item) || typeof item.appId !== "string") return;

    const manifest = lookup(item.appId);

    if (!manifest || typeof item.processId !== "string") return;
    if (!item.processId.startsWith(`${manifest.appId}-`)) return;
    if (seen.has(item.processId)) return;
    if (
      !finite(item.width) ||
      !finite(item.height) ||
      !finite(item.x) ||
      !finite(item.y) ||
      !finite(item.z)
    ) {
      return;
    }

    const box = clampBox(
      {
        height: Math.min(800, Math.max(MIN_HEIGHT, item.height)),
        width: Math.min(1200, Math.max(MIN_WIDTH, item.width)),
        x: item.x,
        y: item.y,
      },
      display
    );

    seen.add(item.processId);
    processes.push({
      appId: manifest.appId,
      processId: item.processId,
      title: manifest.title,
    });
    windows.push({
      focused: item.focused === true,
      height: box.height,
      minimized: item.minimized === true,
      processId: item.processId,
      title: manifest.title,
      width: box.width,
      windowId: `window:${item.processId}`,
      x: box.x,
      y: box.y,
      z: item.z,
    });
  });

  return {
    ...shell,
    processes,
    windows: focusWindows(windows),
  };
};

export const encodeLayout = (state: ShellSnapshot): Uint8Array | undefined => {
  const bytes = new TextEncoder().encode(JSON.stringify(captureLayout(state)));

  if (bytes.byteLength > MAX_LAYOUT_BYTES) return undefined;

  return bytes;
};

export const decodeLayout = (
  bytes: Uint8Array | undefined,
  display: { height: number; width: number },
  lookup: (appId: string) => AppManifest | undefined
): ShellSnapshot => {
  if (!bytes || bytes.byteLength > MAX_LAYOUT_BYTES) return emptyShell();

  try {
    return restoreLayout(
      JSON.parse(new TextDecoder().decode(bytes)),
      display,
      lookup
    );
  } catch {
    return emptyShell();
  }
};
