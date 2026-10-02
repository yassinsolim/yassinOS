import { isSessionKind, type SessionKind } from "shell/model";
import {
  acceptBridgeOffer,
  acceptEmbedHello,
  acceptHandoffCommand,
  acceptSessionReport,
  type BridgeOffer,
  isAllowedParentOrigin,
  ROOM_PROTOCOL,
  type SessionReport,
} from "shell/protocol";
import { STORE_PREFIX } from "shell/storage";

export type { SessionKind } from "shell/model";

export const SESSION_PREF_VERSION = 1;
export const SESSION_PREF_KEY = `${STORE_PREFIX}session.json`;
export const MAX_PREF_BYTES = 4096;
export const MAX_ENDPOINT_LENGTH = 2048;
export const WEBSSH_HANDLER = "webssh";

export const STREAM_DISABLED = "No Moonlight bridge is connected.";
export const NATIVE_STREAM_MISSING =
  "Moonlight is not installed on this computer.";
export const NATIVE_STREAM_NEEDS_TARGET =
  "Set a host and an app. This page does not speak GameStream.";
export const NATIVE_STREAM_READY =
  "Hands off to the Moonlight app on this computer. This page does not speak GameStream.";
export const STREAM_UNREGISTERED = "That handoff handler is not registered.";
export const STREAM_READY =
  "A handoff is available. This page does not speak GameStream.";
export const LAB_DISABLED = "No lab machine is configured.";
export const LAB_READY = "Opens the HTTPS page you saved, after you confirm.";
export const LAB_BRIDGE_READY =
  "The framing page offered a lab handoff. This page does not open SSH.";
export const GESTURE_REQUIRED = "Use a button in this page before leaving it.";
export const CONFIRM_REQUIRED = "Confirmation is required.";
export const HANDOFF_FAILED = "The handoff failed.";
export const POPUP_BLOCKED = "The browser blocked the new tab.";
export const PARENT_LAUNCH_REFUSED =
  "A parent message cannot launch a handoff.";
export const LOCAL_PRIVACY = "Apps and files stay in this browser.";
export const STREAM_PRIVACY =
  "No GameStream client and no saved Sunshine password.";
export const LAB_PRIVACY = "No SSH client and no saved password.";

const HANDLER_ID = /^[a-z][a-z0-9-]{0,31}$/;
const SECRET_QUERY = /^(?:credential|passwd|password|pin|secret|token)$/i;

export type RemoteKind = "lab" | "stream";

export type ProviderPhase =
  | "disabled"
  | "error"
  | "handoff"
  | "ready"
  | "resumed";

export type ProviderView = {
  enabled: boolean;
  id: SessionKind;
  phase: ProviderPhase;
  privacy: string;
  reason: string;
  title: string;
};

export type SessionPreferences = {
  labEndpoint: string;
  providerId: SessionKind;
  streamHandler: string;
  version: typeof SESSION_PREF_VERSION;
};

export type SessionHandler = {
  id: string;
  kind: RemoteKind;
};

export type NativeStreamProbe = {
  configured: boolean;
  installed: boolean;
};

export type SessionAttempt =
  | { name: "confirm"; providerId: RemoteKind }
  | { message: string; name: "error"; providerId: RemoteKind }
  | { name: "handoff"; providerId: RemoteKind }
  | { name: "idle" }
  | { name: "resumed"; providerId: RemoteKind };

export type SessionAccess = {
  development?: boolean;
  origin: string;
  pinnedOrigin: string;
  sourceIsParent: boolean;
};

export type SessionEvent =
  | { kind: "bridge"; offer: BridgeOffer }
  | { kind: "ignore" }
  | { kind: "pin" }
  | { kind: "refused-launch"; reason: string }
  | { kind: "report"; report: SessionReport };

export type HandoffMessage = {
  protocol: typeof ROOM_PROTOCOL;
  provider: RemoteKind;
  type: "yassinos:handoff";
};

export type ShellRoute = "local" | "picker";

export const SHELL_HANDLERS: readonly SessionHandler[] = [
  { id: WEBSSH_HANDLER, kind: "lab" },
];

export const isHandlerId = (value: string): boolean => HANDLER_ID.test(value);

export const emptyPreferences = (): SessionPreferences => ({
  labEndpoint: "",
  providerId: "local",
  streamHandler: "",
  version: SESSION_PREF_VERSION,
});

export const validateLabEndpoint = (
  input: string
): { error: string } | { href: string } => {
  const trimmed = input.trim();

  if (!trimmed) return { error: LAB_DISABLED };
  if (trimmed.length > MAX_ENDPOINT_LENGTH) {
    return { error: "That address is too long." };
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return { error: "That address is not a URL." };
  }

  if (url.protocol !== "https:") {
    return { error: "Lab only opens an HTTPS page." };
  }

  if (url.username || url.password) {
    return { error: "Don't put a username or password in the address." };
  }

  if (!url.hostname) return { error: "That address has no host." };

  const secret = [...url.searchParams.keys()].find((key) =>
    SECRET_QUERY.test(key)
  );

  if (secret) return { error: "Don't put a secret in the address." };

  return { href: `${url.origin}${url.pathname}${url.search}` };
};

export const encodePreferences = (
  prefs: SessionPreferences
): Uint8Array | undefined => {
  const body: {
    labEndpoint?: string;
    providerId: SessionKind;
    streamHandler?: string;
    version: typeof SESSION_PREF_VERSION;
  } = {
    providerId: isSessionKind(prefs.providerId) ? prefs.providerId : "local",
    version: SESSION_PREF_VERSION,
  };
  const endpoint = prefs.labEndpoint
    ? validateLabEndpoint(prefs.labEndpoint)
    : undefined;

  if (endpoint && "href" in endpoint) body.labEndpoint = endpoint.href;
  if (isHandlerId(prefs.streamHandler)) {
    body.streamHandler = prefs.streamHandler;
  }

  const bytes = new TextEncoder().encode(JSON.stringify(body));

  if (bytes.byteLength > MAX_PREF_BYTES) return undefined;

  return bytes;
};

export const decodePreferences = (
  bytes: Uint8Array | undefined
): SessionPreferences => {
  const empty = emptyPreferences();

  if (!bytes || bytes.byteLength > MAX_PREF_BYTES) return empty;

  try {
    const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (typeof raw !== "object" || !raw || Array.isArray(raw)) return empty;

    const record = raw as Record<string, unknown>;

    if (record.version !== SESSION_PREF_VERSION) return empty;

    const providerId =
      typeof record.providerId === "string" && isSessionKind(record.providerId)
        ? record.providerId
        : "local";
    const checked =
      typeof record.labEndpoint === "string"
        ? validateLabEndpoint(record.labEndpoint)
        : undefined;
    const labEndpoint = checked && "href" in checked ? checked.href : "";
    const streamHandler =
      typeof record.streamHandler === "string" &&
      isHandlerId(record.streamHandler)
        ? record.streamHandler
        : "";

    return {
      labEndpoint,
      providerId,
      streamHandler,
      version: SESSION_PREF_VERSION,
    };
  } catch {
    return empty;
  }
};

const view = (
  enabled: boolean,
  id: SessionKind,
  privacy: string,
  reason: string,
  title: string
): ProviderView => ({
  enabled,
  id,
  phase: enabled ? "ready" : "disabled",
  privacy,
  reason,
  title,
});

export const describeProviders = (world: {
  bridge?: BridgeOffer;
  handlers: readonly SessionHandler[];
  labEndpoint: string;
  nativeStream?: NativeStreamProbe;
  streamHandler: string;
}): ProviderView[] => {
  const streamBridge = world.bridge?.providers.includes("stream") ?? false;
  const labBridge = world.bridge?.providers.includes("lab") ?? false;
  const namedStream = world.handlers.some(
    (handler) => handler.kind === "stream" && handler.id === world.streamHandler
  );
  const webssh = world.handlers.some(
    (handler) => handler.kind === "lab" && handler.id === WEBSSH_HANDLER
  );
  const endpoint = world.labEndpoint
    ? validateLabEndpoint(world.labEndpoint)
    : undefined;

  let stream: ProviderView;

  if (world.nativeStream && !world.nativeStream.installed) {
    stream = view(
      false,
      "stream",
      STREAM_PRIVACY,
      NATIVE_STREAM_MISSING,
      "Stream"
    );
  } else if (world.nativeStream && !world.nativeStream.configured) {
    stream = view(
      false,
      "stream",
      STREAM_PRIVACY,
      NATIVE_STREAM_NEEDS_TARGET,
      "Stream"
    );
  } else if (world.nativeStream?.configured) {
    stream = view(
      true,
      "stream",
      STREAM_PRIVACY,
      NATIVE_STREAM_READY,
      "Stream"
    );
  } else if (world.streamHandler && !namedStream && !streamBridge) {
    stream = view(
      false,
      "stream",
      STREAM_PRIVACY,
      STREAM_UNREGISTERED,
      "Stream"
    );
  } else if (namedStream || streamBridge) {
    stream = view(true, "stream", STREAM_PRIVACY, STREAM_READY, "Stream");
  } else {
    stream = view(false, "stream", STREAM_PRIVACY, STREAM_DISABLED, "Stream");
  }

  let lab: ProviderView;

  if (endpoint && "error" in endpoint) {
    lab = view(false, "lab", LAB_PRIVACY, endpoint.error, "Lab");
  } else if (endpoint && "href" in endpoint && webssh) {
    lab = view(true, "lab", LAB_PRIVACY, LAB_READY, "Lab");
  } else if (!world.labEndpoint && labBridge) {
    lab = view(true, "lab", LAB_PRIVACY, LAB_BRIDGE_READY, "Lab");
  } else {
    lab = view(false, "lab", LAB_PRIVACY, LAB_DISABLED, "Lab");
  }

  return [
    view(true, "local", LOCAL_PRIVACY, "This browser.", "Local"),
    stream,
    lab,
  ];
};

export const providerPhase = (
  entry: ProviderView,
  attempt: SessionAttempt
): ProviderPhase => {
  if (!entry.enabled) return "disabled";
  if (attempt.name === "idle" || attempt.name === "confirm") return "ready";
  if (attempt.providerId !== entry.id) return "ready";
  if (attempt.name === "error") return "error";
  if (attempt.name === "handoff") return "handoff";

  return "resumed";
};

export const decideLaunch = (input: {
  gesture: boolean;
  providerId: SessionKind;
  views: readonly ProviderView[];
}):
  | { kind: "confirm"; providerId: RemoteKind }
  | { kind: "denied"; reason: string }
  | { kind: "local" } => {
  const entry = input.views.find((item) => item.id === input.providerId);

  if (!entry?.enabled) {
    return { kind: "denied", reason: entry?.reason ?? "Unavailable." };
  }

  if (input.providerId === "local") return { kind: "local" };
  if (!input.gesture) return { kind: "denied", reason: GESTURE_REQUIRED };

  return { kind: "confirm", providerId: input.providerId };
};

export const confirmLaunch = (input: {
  confirmed: boolean;
  gesture: boolean;
  providerId: RemoteKind;
  views: readonly ProviderView[];
}):
  | { kind: "denied"; reason: string }
  | { kind: "handoff"; providerId: RemoteKind } => {
  if (!input.gesture) return { kind: "denied", reason: GESTURE_REQUIRED };
  if (!input.confirmed) return { kind: "denied", reason: CONFIRM_REQUIRED };

  const decision = decideLaunch({
    gesture: true,
    providerId: input.providerId,
    views: input.views,
  });

  if (decision.kind === "denied") return decision;

  return { kind: "handoff", providerId: input.providerId };
};

export const performHandoff = (input: {
  bridge?: BridgeOffer;
  handlers: readonly SessionHandler[];
  labEndpoint: string;
  launchNative?: () => void;
  nativeStream?: NativeStreamProbe;
  notify: (message: HandoffMessage) => void;
  openLab: (href: string) => boolean;
  openStream: (handlerId: string) => void;
  providerId: RemoteKind;
  streamHandler: string;
}): { ok: true } | { ok: false; reason: string } => {
  const views = describeProviders(input);
  const entry = views.find((item) => item.id === input.providerId);

  if (!entry?.enabled) {
    return { ok: false, reason: entry?.reason ?? "Unavailable." };
  }

  if (
    input.providerId === "stream" &&
    input.nativeStream?.installed &&
    input.nativeStream.configured
  ) {
    if (!input.launchNative) return { ok: false, reason: HANDOFF_FAILED };

    try {
      input.launchNative();
    } catch {
      return { ok: false, reason: HANDOFF_FAILED };
    }

    return { ok: true };
  }

  if (input.providerId === "stream") {
    const named = input.handlers.find(
      (handler) =>
        handler.kind === "stream" && handler.id === input.streamHandler
    );

    if (named) {
      try {
        input.openStream(named.id);
      } catch {
        return { ok: false, reason: HANDOFF_FAILED };
      }

      return { ok: true };
    }

    input.notify({
      protocol: ROOM_PROTOCOL,
      provider: "stream",
      type: "yassinos:handoff",
    });

    return { ok: true };
  }

  const endpoint = input.labEndpoint
    ? validateLabEndpoint(input.labEndpoint)
    : undefined;
  const webssh = input.handlers.some(
    (handler) => handler.kind === "lab" && handler.id === WEBSSH_HANDLER
  );

  if (endpoint && "href" in endpoint && webssh) {
    if (!input.openLab(endpoint.href)) {
      return { ok: false, reason: POPUP_BLOCKED };
    }

    return { ok: true };
  }

  input.notify({
    protocol: ROOM_PROTOCOL,
    provider: "lab",
    type: "yassinos:handoff",
  });

  return { ok: true };
};

const originAllowed = (access: SessionAccess): boolean => {
  if (!access.sourceIsParent) return false;
  if (access.pinnedOrigin) return access.origin === access.pinnedOrigin;

  return isAllowedParentOrigin(access.origin, access.development);
};

export const readSessionEvent = (
  data: unknown,
  access: SessionAccess
): SessionEvent => {
  if (!originAllowed(access)) return { kind: "ignore" };
  if (acceptEmbedHello(data)) return { kind: "pin" };
  if (acceptHandoffCommand(data)) {
    return { kind: "refused-launch", reason: PARENT_LAUNCH_REFUSED };
  }

  const offer = acceptBridgeOffer(data);

  if (offer) return { kind: "bridge", offer };

  const report = acceptSessionReport(data);

  if (report) return { kind: "report", report };

  return { kind: "ignore" };
};

export const sessionCatalogMessage = (
  views: readonly ProviderView[]
): {
  protocol: typeof ROOM_PROTOCOL;
  providers: { enabled: boolean; id: SessionKind; reason: string }[];
  type: "yassinos:sessions";
} => ({
  protocol: ROOM_PROTOCOL,
  providers: views.map((entry) => ({
    enabled: entry.enabled,
    id: entry.id,
    reason: entry.reason,
  })),
  type: "yassinos:sessions",
});

export const sessionFromSearch = (search: string): ShellRoute => {
  const query = search.startsWith("?") ? search.slice(1) : search;

  return new URLSearchParams(query).get("session") === "local"
    ? "local"
    : "picker";
};

export const reduceShellRoute = (
  route: ShellRoute,
  action: "back" | "direct-local" | "open-local"
): ShellRoute => {
  if (action === "back") return "picker";
  if (action === "direct-local" || action === "open-local") return "local";

  return route;
};
