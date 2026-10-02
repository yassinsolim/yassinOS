import { FILES, FRAME_MONITOR, manifestById } from "shell/manifest";
import { emptyShell, openProcess } from "shell/model";
import {
  captureLayout,
  decodeLayout,
  LAYOUT_VERSION,
  restoreLayout,
  shouldSaveLayout,
} from "shell/layout";

const display = { height: 400, width: 400 };

describe("layout snapshot", () => {
  test("rejects another version and unknown apps", () => {
    const valid = {
      appId: "frame-monitor",
      focused: true,
      height: 280,
      minimized: false,
      processId: "frame-monitor-1",
      width: 360,
      x: 48,
      y: 48,
      z: 1,
    };

    expect(
      restoreLayout({ version: 2, windows: [valid] }, display, manifestById)
        .windows
    ).toEqual([]);
    expect(
      restoreLayout({ version: 0, windows: [valid] }, display, manifestById)
        .windows
    ).toEqual([]);

    const restored = restoreLayout(
      {
        version: LAYOUT_VERSION,
        windows: [valid, { ...valid, appId: "quake", processId: "quake-1" }],
      },
      display,
      manifestById
    );

    expect(restored.processes.map((process) => process.appId)).toEqual([
      "frame-monitor",
    ]);
    expect(restored.windows[0]?.title).toBe(FRAME_MONITOR.title);
  });

  test("clamps bounds and keeps a saved files window", () => {
    const restored = restoreLayout(
      {
        version: LAYOUT_VERSION,
        windows: [
          {
            appId: FILES.appId,
            focused: true,
            height: 5000,
            minimized: true,
            processId: "files-1",
            width: 360,
            x: 5000,
            y: -40,
            z: 2,
          },
          {
            appId: "frame-monitor",
            focused: false,
            height: 280,
            minimized: false,
            processId: "not-an-id",
            width: 360,
            x: 10,
            y: 10,
            z: 1,
          },
        ],
      },
      display,
      manifestById
    );
    const files = restored.windows[0];

    expect(restored.windows).toHaveLength(1);
    expect(files?.x).toBeLessThan(display.width);
    expect(files?.y).toBe(0);
    expect(files?.height).toBeLessThanOrEqual(800);
    expect(files?.minimized).toBe(true);
    expect(files?.focused).toBe(false);
  });

  test("round-trips the open windows and ignores a bad blob", () => {
    const opened = openProcess(
      emptyShell(),
      { appId: "files", height: 340, title: "Files", width: 420 },
      "files-1"
    );
    const encoded = new TextEncoder().encode(
      JSON.stringify(captureLayout(opened))
    );
    const restored = decodeLayout(encoded, display, manifestById);

    expect(restored.processes.map((process) => process.processId)).toEqual([
      "files-1",
    ]);
    expect(
      decodeLayout(new Uint8Array([123]), display, manifestById).windows
    ).toEqual([]);
    expect(shouldSaveLayout(true, false)).toBe(true);
    expect(shouldSaveLayout(true, true)).toBe(false);
    expect(shouldSaveLayout(false, false)).toBe(false);
  });
});
