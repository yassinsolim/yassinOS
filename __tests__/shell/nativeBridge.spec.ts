import { readFileSync } from "node:fs";
import path from "node:path";
import {
  checkStreamApp,
  checkStreamHost,
  readNativeBridge,
  tauriInvoke,
} from "shell/nativeBridge";
import {
  HANDOFF_FAILED,
  NATIVE_STREAM_MISSING,
  NATIVE_STREAM_NEEDS_TARGET,
  NATIVE_STREAM_READY,
  STREAM_DISABLED,
  STREAM_READY,
  describeProviders,
  performHandoff,
  SHELL_HANDLERS,
} from "shell/session";

const quiet = {
  handlers: SHELL_HANDLERS,
  labEndpoint: "",
  streamHandler: "",
};

describe("native stream bridge", () => {
  test("stays disabled on the website and enables only a confirmed local target", async () => {
    expect(tauriInvoke({})).toBeUndefined();
    expect(await readNativeBridge()).toMatchObject({
      available: false,
      reason: STREAM_DISABLED,
    });
    expect(
      describeProviders(quiet).find((entry) => entry.id === "stream")?.reason
    ).toBe(STREAM_DISABLED);
    expect(
      describeProviders({
        ...quiet,
        bridge: { providers: ["stream"] },
      }).find((entry) => entry.id === "stream")?.reason
    ).toBe(STREAM_READY);

    const missing = await readNativeBridge((command) => {
      if (command === "bridge_status") {
        return Promise.resolve({ installed: false });
      }

      return Promise.reject(new Error("unexpected"));
    });

    expect(missing.reason).toBe(NATIVE_STREAM_MISSING);
    expect(
      describeProviders({
        ...quiet,
        bridge: { providers: ["stream"] },
        nativeStream: { configured: false, installed: false },
      }).find((entry) => entry.id === "stream")?.enabled
    ).toBe(false);

    const bare = await readNativeBridge((command) => {
      if (command === "bridge_status") {
        return Promise.resolve({
          executable: "/Applications/Moonlight.app",
          installed: true,
        });
      }

      return Promise.resolve({});
    });

    expect(bare).toMatchObject({
      available: true,
      configured: false,
      installed: true,
      reason: NATIVE_STREAM_NEEDS_TARGET,
    });
    expect(
      describeProviders({
        ...quiet,
        nativeStream: { configured: true, installed: true },
      }).find((entry) => entry.id === "stream")
    ).toMatchObject({ enabled: true, reason: NATIVE_STREAM_READY });
  });

  test("rejects flags and reports a failed native launch without calling the parent", () => {
    expect(checkStreamHost("-help")).toEqual({
      error: "That host is not allowed.",
    });
    expect(checkStreamHost("desk.local;rm")).toEqual({
      error: "That host is not allowed.",
    });
    expect(checkStreamHost("192.168.1.20")).toEqual({ value: "192.168.1.20" });
    expect(checkStreamApp("--quit-after")).toEqual({
      error: "That app name is not allowed.",
    });
    expect(checkStreamApp("Desktop")).toEqual({ value: "Desktop" });

    const notify = jest.fn();
    const launchNative = jest.fn(() => {
      throw new Error("moonlight missing");
    });

    expect(
      performHandoff({
        handlers: SHELL_HANDLERS,
        labEndpoint: "",
        launchNative,
        nativeStream: { configured: true, installed: true },
        notify,
        openLab: () => true,
        openStream: () => {
          // the native path does not use a web handler
        },
        providerId: "stream",
        streamHandler: "",
      })
    ).toEqual({ ok: false, reason: HANDOFF_FAILED });
    expect(notify).not.toHaveBeenCalled();

    const started = jest.fn();

    expect(
      performHandoff({
        handlers: SHELL_HANDLERS,
        labEndpoint: "",
        launchNative: started,
        nativeStream: { configured: true, installed: true },
        notify,
        openLab: () => true,
        openStream: () => {
          // the native path does not use a web handler
        },
        providerId: "stream",
        streamHandler: "",
      })
    ).toEqual({ ok: true });
    expect(started).toHaveBeenCalledTimes(1);
  });

  test("the desktop capability allowlist has no shell and no wildcard", () => {
    const permissions = readFileSync(
      path.join(process.cwd(), "native/src-tauri/permissions/stream.toml"),
      "utf8"
    );
    const capability = readFileSync(
      path.join(process.cwd(), "native/src-tauri/capabilities/default.json"),
      "utf8"
    );

    expect(permissions).toContain("launch_stream");
    expect(permissions).toContain("preview_launch");
    expect(permissions).not.toMatch(/shell|process|\*/);
    expect(capability).not.toMatch(/core:default|shell|\*/);
    expect(
      readFileSync(
        path.join(process.cwd(), "native/src-tauri/Cargo.toml"),
        "utf8"
      )
    ).not.toContain("tauri-plugin-shell");
  });
});
