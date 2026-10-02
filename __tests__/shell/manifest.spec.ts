import {
  APP_REGISTRY,
  FRAME_MONITOR,
  readManifest,
  registryIssues,
  validateManifest,
  WASM_BENCH,
} from "shell/manifest";

describe("app manifests", () => {
  test("the registry is unique and valid", () => {
    expect(registryIssues(APP_REGISTRY)).toEqual([]);
    expect(APP_REGISTRY.map((app) => app.appId)).toEqual([
      "frame-monitor",
      "wasm-bench",
    ]);
    expect(FRAME_MONITOR.entry).toBe("dom");
    expect(WASM_BENCH.entry).toBe("worker");
    expect(readManifest(FRAME_MONITOR)?.capabilities).toEqual(["frame-time"]);
  });

  test("rejects a broken manifest", () => {
    expect(validateManifest([]).map((issue) => issue.reason)).toEqual([
      "expected an object",
    ]);
    expect(
      validateManifest({
        ...FRAME_MONITOR,
        appId: "Frame",
        capabilities: ["storage", "frame-time", "frame-time"],
        entry: "page",
        extra: true,
        height: 10,
        icon: "frame time",
        title: "",
        width: 10,
      }).map((issue) => issue.path)
    ).toEqual([
      "extra",
      "appId",
      "title",
      "icon",
      "entry",
      "width",
      "height",
      "capabilities",
      "capabilities",
    ]);
    expect(
      registryIssues([FRAME_MONITOR, { ...WASM_BENCH, appId: "frame-monitor" }])
        .map((issue) => issue.reason)
        .includes("duplicate id")
    ).toBe(true);
    expect(readManifest({ ...FRAME_MONITOR, title: "" })).toBeUndefined();
  });
});
