import { readFileSync } from "node:fs";
import path from "node:path";
import { FILES, FRAME_MONITOR, WASM_BENCH } from "shell/manifest";
import { emptyShell, openProcess } from "shell/model";
import { guestDocument } from "shell/next/guest";
import { ROOM_MESSAGE, parseRoomParent } from "shell/protocol";
import { applyRoomControl, roomState } from "shell/roomState";
import {
  authorizeGuest,
  OPAQUE_ORIGIN,
  replyToGuest,
  sandboxTokensAllowParentOrigin,
  SANDBOX_TOKENS,
} from "shell/sandbox";
import { runWasmStep, WASM_STEP, WASM_STEP_OF_ONE } from "shell/wasmStep";

const frame = { id: "guest" };
const host = {
  appId: "wasm-bench",
  contentWindow: frame,
  granted: ["wasm-bench"],
};

const request = (capability: string): unknown => ({
  capability,
  id: "run-1",
  protocol: 1,
  type: "shell:request",
});

describe("sandbox messages", () => {
  test("scripts without the parent origin", () => {
    expect(SANDBOX_TOKENS).toBe("allow-scripts");
    expect(sandboxTokensAllowParentOrigin(SANDBOX_TOKENS)).toBe(false);
    expect(
      sandboxTokensAllowParentOrigin("allow-scripts allow-same-origin")
    ).toBe(true);
    expect(
      readFileSync(path.join(process.cwd(), "shell/next/AppHost.tsx"), "utf8")
    ).not.toContain("allow-same-origin");
  });

  test("drops the wrong source, origin, or schema", () => {
    const event = { origin: OPAQUE_ORIGIN, source: frame };

    expect(
      authorizeGuest(
        { appId: "wasm-bench", protocol: 1, type: "shell:ready" },
        { origin: OPAQUE_ORIGIN, source: {} },
        host
      )
    ).toEqual({ kind: "drop", reason: "source" });
    expect(
      authorizeGuest(
        { appId: "wasm-bench", protocol: 1, type: "shell:ready" },
        { origin: "https://yassin.app", source: frame },
        host
      )
    ).toEqual({ kind: "drop", reason: "origin" });
    expect(
      authorizeGuest(
        { appId: "other-app", protocol: 1, type: "shell:ready" },
        event,
        host
      )
    ).toEqual({ kind: "drop", reason: "app" });
    expect(
      authorizeGuest({ protocol: 2, type: "shell:ready" }, event, host)
    ).toEqual({ kind: "drop", reason: "schema" });
    expect(
      authorizeGuest(
        { appId: "wasm-bench", protocol: 1, type: "shell:ready" },
        event,
        host
      )
    ).toEqual({ appId: "wasm-bench", kind: "ready" });
  });

  test("denies a capability the manifest did not grant", () => {
    const denied = authorizeGuest(
      request("frame-time"),
      {
        origin: OPAQUE_ORIGIN,
        source: frame,
      },
      host
    );

    expect(denied).toEqual({
      capability: "frame-time",
      id: "run-1",
      kind: "deny",
    });
    expect(replyToGuest(denied, host.granted)).toEqual({
      capability: "frame-time",
      id: "run-1",
      protocol: 1,
      type: "shell:deny",
    });
    expect(replyToGuest(denied, host.granted)).not.toHaveProperty("module");
  });

  test("sends the wasm module only after wasm-bench is allowed", async () => {
    const allowed = authorizeGuest(
      request("wasm-bench"),
      {
        origin: OPAQUE_ORIGIN,
        source: frame,
      },
      host
    );
    const reply = replyToGuest(allowed, host.granted, WASM_STEP);

    expect(reply).toMatchObject({
      id: "run-1",
      ok: true,
      protocol: 1,
      type: "shell:result",
    });
    expect(reply && "module" in reply ? reply.module : []).toEqual([
      ...WASM_STEP,
    ]);

    expect(await runWasmStep(1)).toBe(WASM_STEP_OF_ONE);

    const frameReply = replyToGuest(
      { capability: "frame-time", id: "boot", kind: "allow" },
      ["frame-time"]
    );

    expect(frameReply).not.toHaveProperty("module");
    expect(guestDocument(WASM_BENCH)).not.toContain("141,243,101");
    expect(guestDocument(FILES)).not.toContain("141,243,101");
    expect(guestDocument(FILES)).toContain("prefers-reduced-motion");
    expect(guestDocument(FRAME_MONITOR)).not.toMatch(
      /localStorage|indexedDB|parent\.document|document\.cookie/
    );
    expect(guestDocument(FILES)).not.toMatch(
      /localStorage|indexedDB|FileSystemHandle|parent\.document|document\.cookie/
    );
  });
});

describe("embed pause and resume", () => {
  test("pause and resume change the flag and open does not", () => {
    expect(
      applyRoomControl(false, parseRoomParent({ type: ROOM_MESSAGE.PAUSE }))
    ).toBe(true);
    expect(
      applyRoomControl(true, parseRoomParent({ type: ROOM_MESSAGE.RESUME }))
    ).toBe(false);
    expect(
      applyRoomControl(
        false,
        parseRoomParent({ app: "Browser", type: ROOM_MESSAGE.OPEN })
      )
    ).toBe(false);
    expect(
      applyRoomControl(
        true,
        parseRoomParent({ protocol: 1, type: ROOM_MESSAGE.HELLO })
      )
    ).toBe(true);
  });

  test("state names the open apps and drops a hidden focus", () => {
    const opened = openProcess(
      emptyShell(),
      { appId: "frame-monitor", title: "Frame time" },
      "frame-monitor-1"
    );

    expect(roomState(opened)).toEqual({
      apps: ["frame-monitor"],
      focused: "frame-monitor",
      type: ROOM_MESSAGE.STATE,
    });
    expect(roomState(emptyShell()).focused).toBeNull();
  });
});
