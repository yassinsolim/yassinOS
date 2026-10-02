import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { acceptRoomHello, ROOM_HELLO, ROOM_PROTOCOL } from "shell/protocol";
import {
  emptyShell,
  focusWindow,
  isSessionKind,
  openProcess,
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
  });
});

describe("classic desktop", () => {
  test("does not import the new shell", () => {
    const importsShell = /from ["']shell\//;
    const offenders = WIRED_ROOTS.flatMap((directory) =>
      filesUnder(directory)
    ).filter((filePath) => importsShell.test(readFileSync(filePath, "utf8")));

    expect(offenders).toEqual([]);
  });
});
