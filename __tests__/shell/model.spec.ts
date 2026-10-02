import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  acceptRoomHello,
  parseRoomParent,
  ROOM_HELLO,
  ROOM_MESSAGE,
  ROOM_PROTOCOL,
} from "shell/protocol";
import {
  closeWindow,
  emptyShell,
  focusWindow,
  isSessionKind,
  minimizeWindow,
  nextProcessId,
  openProcess,
  placeWindow,
  raiseWindow,
  restoreWindow,
} from "shell/model";

const ROOT = process.cwd();
const WIRED_ROOTS = [
  "pages",
  "components",
  "contexts",
  "hooks",
  "utils",
  "styles",
];

const filesUnder = (directory: string): string[] => {
  const absolute = path.join(ROOT, directory);
  return readdirSync(absolute).flatMap((name) => {
    const entryPath = path.join(absolute, name);
    if (statSync(entryPath).isDirectory()) {
      return filesUnder(path.join(directory, name));
    }
    return /\.(?:ts|tsx|js|jsx)$/.test(name) ? [entryPath] : [];
  });
};

describe("shell model", () => {
  test("starts local, with one display and no windows", () => {
    const shell = emptyShell();

    expect(shell.session).toBe("local");
    expect(shell.displays.map((display) => display.displayId)).toEqual([
      "main",
    ]);
    expect(shell.processes).toEqual([]);
    expect(shell.windows).toEqual([]);
    expect(isSessionKind("stream")).toBe(true);
    expect(isSessionKind("lab")).toBe(true);
    expect(isSessionKind("macos")).toBe(false);
  });

  test("opens a process on top and moves focus", () => {
    const first = openProcess(
      emptyShell(),
      { appId: "monitor", title: "Monitor" },
      "p1"
    );
    const second = openProcess(
      first,
      { appId: "stream", title: "Stream" },
      "p2"
    );

    expect(second.processes.map((process) => process.processId)).toEqual([
      "p1",
      "p2",
    ]);
    expect(second.windows.map((entry) => entry.focused)).toEqual([false, true]);

    const focused = focusWindow(second, "window:p1");

    expect(focused.windows.map((entry) => entry.focused)).toEqual([
      true,
      false,
    ]);
    expect(focused.windows.map((entry) => entry.z)).toEqual([1, 2]);

    const raised = raiseWindow(second, "window:p1");

    expect(raised.windows.map((entry) => entry.focused)).toEqual([true, false]);
    expect(raised.windows.map((entry) => entry.z)).toEqual([3, 2]);

    const moved = placeWindow(raised, "window:p1", {
      height: 200,
      width: 320,
      x: 80,
      y: 40,
    });
    const placed = moved.windows.find(
      (entry) => entry.windowId === "window:p1"
    );

    expect(placed).toMatchObject({
      focused: true,
      height: 200,
      width: 320,
      x: 80,
      y: 40,
      z: 3,
    });
    expect(second.windows.every((entry) => !entry.minimized)).toBe(true);
  });

  test("hides, restores, and closes without losing the other window", () => {
    const first = openProcess(
      emptyShell(),
      { appId: "frame-monitor", title: "Frame time" },
      nextProcessId(emptyShell(), "frame-monitor")
    );
    const second = openProcess(
      first,
      { appId: "wasm-bench", title: "Wasm pace" },
      nextProcessId(first, "wasm-bench")
    );

    const hidden = minimizeWindow(second, "window:wasm-bench-1");

    expect(hidden.windows.map((entry) => entry.minimized)).toEqual([
      false,
      true,
    ]);
    expect(hidden.windows.map((entry) => entry.focused)).toEqual([true, false]);

    const restored = restoreWindow(hidden, "window:wasm-bench-1");
    const front = restored.windows.find(
      (entry) => entry.windowId === "window:wasm-bench-1"
    );

    expect(front).toMatchObject({ focused: true, minimized: false, z: 3 });
    expect(
      restored.windows.find(
        (entry) => entry.windowId === "window:frame-monitor-1"
      )?.focused
    ).toBe(false);

    const closed = closeWindow(restored, "window:wasm-bench-1");

    expect(closed.processes.map((process) => process.processId)).toEqual([
      "frame-monitor-1",
    ]);
    expect(closed.windows.map((entry) => entry.focused)).toEqual([true]);
    expect(closeWindow(closed, "missing")).toBe(closed);
  });
});

describe("room protocol boundary", () => {
  test("accepts a protocol 1 hello and rejects everything else", () => {
    expect(
      acceptRoomHello({
        display: "main",
        protocol: ROOM_PROTOCOL,
        size: [1600, 900],
        tier: "low",
        type: ROOM_HELLO,
      })
    ).toEqual({
      display: "main",
      protocol: ROOM_PROTOCOL,
      size: [1600, 900],
      tier: "low",
      type: ROOM_HELLO,
    });
    expect(acceptRoomHello({ protocol: 1, type: ROOM_HELLO })).toEqual({
      protocol: ROOM_PROTOCOL,
      type: ROOM_HELLO,
    });
    expect(acceptRoomHello({ protocol: 2, type: ROOM_HELLO })).toBeUndefined();
    expect(
      acceptRoomHello({ display: "other", protocol: 1, type: ROOM_HELLO })
    ).toBeUndefined();
    expect(acceptRoomHello({ type: "yassinos:pause" })).toBeUndefined();

    const newer = { protocol: 2, type: ROOM_HELLO };

    expect(parseRoomParent(newer)).toEqual(newer);
    expect(acceptRoomHello(newer)).toBeUndefined();
    expect(parseRoomParent({ type: ROOM_MESSAGE.PAUSE })).toEqual({
      type: ROOM_MESSAGE.PAUSE,
    });
    expect(
      parseRoomParent({ app: "Browser", type: ROOM_MESSAGE.OPEN })
    ).toEqual({
      app: "Browser",
      type: ROOM_MESSAGE.OPEN,
    });
  });
});

const repoPath = (filePath: string): string =>
  path.relative(ROOT, filePath).split(path.sep).join("/");

describe("classic desktop", () => {
  test("does not import the new compositor", () => {
    const importsShell = /from ["']shell\//;
    const importsCompositor = /from ["']shell\/next\//;
    const protocolOnly = new Set(["utils/embedBridge.ts"]);
    const offenders = WIRED_ROOTS.flatMap((directory) =>
      filesUnder(directory)
    ).filter((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const relative = repoPath(filePath);

      if (relative === "pages/next.tsx") return false;
      if (relative === "pages/_document.tsx") {
        return (
          importsCompositor.test(source) ||
          /from ["']shell\/(?!route["'])/.test(source)
        );
      }
      if (importsCompositor.test(source)) return true;
      if (!importsShell.test(source)) return false;

      return !protocolOnly.has(relative);
    });

    expect(offenders).toEqual([]);
    expect(
      readFileSync(path.join(ROOT, "pages/index.tsx"), "utf8")
    ).not.toMatch(/shell\//);
    expect(
      readFileSync(path.join(ROOT, "utils/embedBridge.ts"), "utf8")
    ).toMatch(/from ["']shell\/protocol["']/);
  });

  test("the next shell does not import the classic desktop", () => {
    const forbidden = /from ["'](?:components\/system|contexts\/process)/;
    const files = [...filesUnder("shell"), path.join(ROOT, "pages/next.tsx")];

    expect(
      files.filter((filePath) => forbidden.test(readFileSync(filePath, "utf8")))
    ).toEqual([]);
  });
});
