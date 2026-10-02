import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOM_MESSAGE, ROOM_PROTOCOL, parseRoomParent } from "shell/protocol";
import {
  CONFIRM_REQUIRED,
  GESTURE_REQUIRED,
  HANDOFF_FAILED,
  LAB_DISABLED,
  LAB_READY,
  PARENT_LAUNCH_REFUSED,
  POPUP_BLOCKED,
  SHELL_HANDLERS,
  STREAM_DISABLED,
  STREAM_READY,
  STREAM_UNREGISTERED,
  WEBSSH_HANDLER,
  confirmLaunch,
  decideLaunch,
  decodePreferences,
  describeProviders,
  emptyPreferences,
  encodePreferences,
  performHandoff,
  providerPhase,
  readSessionEvent,
  reduceShellRoute,
  sessionFromSearch,
  validateLabEndpoint,
} from "shell/session";

const quiet = {
  handlers: SHELL_HANDLERS,
  labEndpoint: "",
  streamHandler: "",
};

const allowed = {
  origin: "https://yassin.app",
  pinnedOrigin: "",
  sourceIsParent: true,
};

describe("session providers", () => {
  test("enables only local until a real handoff exists", () => {
    const views = describeProviders(quiet);

    expect(
      views.map((entry) => [entry.id, entry.enabled, entry.reason])
    ).toEqual([
      ["local", true, "This browser."],
      ["stream", false, STREAM_DISABLED],
      ["lab", false, LAB_DISABLED],
    ]);
    expect(SHELL_HANDLERS.map((handler) => handler.kind)).toEqual(["lab"]);
    expect(SHELL_HANDLERS.map((handler) => handler.id)).toEqual([
      WEBSSH_HANDLER,
    ]);
    expect(
      readFileSync(path.join(process.cwd(), "shell/session.ts"), "utf8")
    ).not.toContain("window.open");
    expect(
      readFileSync(
        path.join(process.cwd(), "shell/next/useParentSession.ts"),
        "utf8"
      )
    ).not.toContain("window.open");
  });

  test("rejects a bad lab address and keeps a valid https page", () => {
    expect(validateLabEndpoint("")).toEqual({ error: LAB_DISABLED });
    expect(validateLabEndpoint("ssh://lab.example")).toEqual({
      error: "Lab only opens an HTTPS page.",
    });
    expect(validateLabEndpoint("http://lab.example")).toEqual({
      error: "Lab only opens an HTTPS page.",
    });
    expect(validateLabEndpoint("https://user:pass@lab.example/ssh")).toEqual({
      error: "Don't put a username or password in the address.",
    });
    expect(validateLabEndpoint("https://lab.example/ssh?token=1")).toEqual({
      error: "Don't put a secret in the address.",
    });
    expect(validateLabEndpoint("https://lab.example/ssh")).toEqual({
      href: "https://lab.example/ssh",
    });

    const views = describeProviders({
      ...quiet,
      labEndpoint: "https://lab.example/ssh",
    });

    expect(views.find((entry) => entry.id === "lab")).toMatchObject({
      enabled: true,
      reason: LAB_READY,
    });
    expect(
      describeProviders({ ...quiet, labEndpoint: "not a url" }).find(
        (entry) => entry.id === "lab"
      )?.reason
    ).toBe("That address is not a URL.");
  });

  test("enables stream only for a bridge or a registered handler", () => {
    expect(
      describeProviders({
        ...quiet,
        bridge: { providers: ["stream"] },
      }).find((entry) => entry.id === "stream")
    ).toMatchObject({ enabled: true, reason: STREAM_READY });
    expect(
      describeProviders({ ...quiet, streamHandler: "moonlight" }).find(
        (entry) => entry.id === "stream"
      )?.reason
    ).toBe(STREAM_UNREGISTERED);
    expect(
      describeProviders({
        ...quiet,
        handlers: [...SHELL_HANDLERS, { id: "native-bridge", kind: "stream" }],
        streamHandler: "native-bridge",
      }).find((entry) => entry.id === "stream")?.enabled
    ).toBe(true);
  });
});

describe("session preferences", () => {
  test("stores the provider id and drops secrets and unknown versions", () => {
    const saved = encodePreferences({
      ...emptyPreferences(),
      labEndpoint: "https://lab.example/ssh",
      providerId: "lab",
    });
    const decoded = decodePreferences(saved);

    expect(decoded.providerId).toBe("lab");
    expect(decoded.labEndpoint).toBe("https://lab.example/ssh");
    expect(JSON.stringify(decoded)).not.toMatch(/password|token|user/i);

    const poisoned = new TextEncoder().encode(
      JSON.stringify({
        labEndpoint: "https://user:pass@lab.example",
        password: "sunshine",
        providerId: "stream",
        token: "secret",
        version: 1,
      })
    );

    expect(decodePreferences(poisoned)).toEqual({
      ...emptyPreferences(),
      providerId: "stream",
    });
    expect(
      decodePreferences(
        new TextEncoder().encode('{"version":2,"providerId":"local"}')
      )
    ).toEqual(emptyPreferences());
    expect(decodePreferences(new Uint8Array([123]))).toEqual(
      emptyPreferences()
    );
  });
});

describe("parent session messages", () => {
  test("keeps classic room messages and refuses a parent launch", () => {
    expect(parseRoomParent({ type: ROOM_MESSAGE.PAUSE })).toEqual({
      type: ROOM_MESSAGE.PAUSE,
    });
    expect(
      parseRoomParent({
        protocol: ROOM_PROTOCOL,
        providers: ["stream"],
        type: ROOM_MESSAGE.BRIDGE,
      })
    ).toBeUndefined();
    expect(parseRoomParent({ protocol: 2, type: ROOM_MESSAGE.HELLO })).toEqual({
      protocol: 2,
      type: ROOM_MESSAGE.HELLO,
    });

    const bridge = {
      protocol: ROOM_PROTOCOL,
      providers: ["stream"],
      type: ROOM_MESSAGE.BRIDGE,
    };

    expect(readSessionEvent(bridge, allowed)).toEqual({
      kind: "bridge",
      offer: { providers: ["stream"] },
    });
    expect(
      readSessionEvent(bridge, { ...allowed, origin: "https://evil.example" })
    ).toEqual({ kind: "ignore" });
    expect(
      readSessionEvent(bridge, { ...allowed, sourceIsParent: false })
    ).toEqual({ kind: "ignore" });
    expect(
      readSessionEvent(bridge, {
        ...allowed,
        origin: "https://www.yassin.app",
        pinnedOrigin: "https://yassin.app",
      })
    ).toEqual({ kind: "ignore" });
    expect(
      readSessionEvent(
        { protocol: 2, providers: ["stream"], type: ROOM_MESSAGE.BRIDGE },
        allowed
      )
    ).toEqual({ kind: "ignore" });
    expect(
      readSessionEvent(
        {
          password: "nope",
          protocol: ROOM_PROTOCOL,
          providers: ["stream"],
          type: ROOM_MESSAGE.BRIDGE,
        },
        allowed
      )
    ).toEqual({ kind: "ignore" });

    const command = {
      protocol: ROOM_PROTOCOL,
      provider: "stream",
      type: ROOM_MESSAGE.HANDOFF,
    };

    expect(readSessionEvent(command, allowed)).toEqual({
      kind: "refused-launch",
      reason: PARENT_LAUNCH_REFUSED,
    });
    expect(
      readSessionEvent(command, { ...allowed, origin: "https://evil.example" })
    ).toEqual({ kind: "ignore" });
  });
});

describe("handoff", () => {
  const views = describeProviders({
    ...quiet,
    labEndpoint: "https://lab.example/ssh",
  });

  test("requires a gesture and a confirmation", () => {
    expect(decideLaunch({ gesture: false, providerId: "lab", views })).toEqual({
      kind: "denied",
      reason: GESTURE_REQUIRED,
    });
    expect(decideLaunch({ gesture: true, providerId: "local", views })).toEqual(
      {
        kind: "local",
      }
    );
    expect(
      decideLaunch({ gesture: true, providerId: "stream", views })
    ).toEqual({ kind: "denied", reason: STREAM_DISABLED });
    expect(
      confirmLaunch({
        confirmed: false,
        gesture: true,
        providerId: "lab",
        views,
      })
    ).toEqual({ kind: "denied", reason: CONFIRM_REQUIRED });
  });

  test("retries a blocked tab and does not open a stream url", () => {
    const openLab = jest
      .fn<boolean, [string]>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const notify = jest.fn();
    const input = {
      handlers: SHELL_HANDLERS,
      labEndpoint: "https://lab.example/ssh",
      notify,
      openLab,
      openStream: () => {
        // this page does not open a stream address
      },
      providerId: "lab" as const,
      streamHandler: "",
    };
    const blocked = performHandoff(input);

    expect(blocked).toEqual({ ok: false, reason: POPUP_BLOCKED });
    expect(performHandoff(input)).toEqual({ ok: true });
    expect(openLab).toHaveBeenLastCalledWith("https://lab.example/ssh");
    expect(notify).not.toHaveBeenCalled();

    const streamNotify = jest.fn();

    expect(
      performHandoff({
        bridge: { providers: ["stream"] },
        handlers: SHELL_HANDLERS,
        labEndpoint: "",
        notify: streamNotify,
        openLab: () => true,
        openStream: () => {
          throw new Error("should not run");
        },
        providerId: "stream",
        streamHandler: "",
      })
    ).toEqual({ ok: true });
    expect(streamNotify).toHaveBeenCalledWith({
      protocol: ROOM_PROTOCOL,
      provider: "stream",
      type: "yassinos:handoff",
    });
  });

  test("reports a failed registered handler and then succeeds", () => {
    const handlers = [
      ...SHELL_HANDLERS,
      { id: "native-bridge", kind: "stream" as const },
    ];
    const openStream = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("bridge down");
      })
      .mockImplementationOnce(() => {
        // the retry reached the registered handler
      });
    const input = {
      handlers,
      labEndpoint: "",
      notify: jest.fn(),
      openLab: () => true,
      openStream,
      providerId: "stream" as const,
      streamHandler: "native-bridge",
    };

    expect(performHandoff(input)).toEqual({
      ok: false,
      reason: HANDOFF_FAILED,
    });
    expect(performHandoff(input)).toEqual({ ok: true });
    expect(input.notify).not.toHaveBeenCalled();
  });
});

describe("local route", () => {
  test("opens local directly and returns to the picker", () => {
    expect(sessionFromSearch("?session=local")).toBe("local");
    expect(sessionFromSearch("?session=stream")).toBe("picker");
    expect(sessionFromSearch("")).toBe("picker");
    expect(reduceShellRoute("picker", "direct-local")).toBe("local");
    expect(reduceShellRoute("picker", "open-local")).toBe("local");
    expect(reduceShellRoute("local", "back")).toBe("picker");

    const local = describeProviders(quiet)[0];

    expect(local && providerPhase(local, { name: "idle" })).toBe("ready");
    expect(
      local &&
        providerPhase(local, {
          message: "down",
          name: "error",
          providerId: "stream",
        })
    ).toBe("ready");

    const stream = describeProviders({
      ...quiet,
      bridge: { providers: ["stream"] },
    }).find((entry) => entry.id === "stream");

    expect(
      stream && providerPhase(stream, { name: "handoff", providerId: "stream" })
    ).toBe("handoff");
    expect(
      stream && providerPhase(stream, { name: "resumed", providerId: "stream" })
    ).toBe("resumed");
  });
});
