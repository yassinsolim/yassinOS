import {
  NATIVE_STREAM_MISSING,
  NATIVE_STREAM_NEEDS_TARGET,
  NATIVE_STREAM_READY,
  STREAM_DISABLED,
} from "shell/session";

export type NativeInvoke = (
  command: string,
  args?: Record<string, unknown>
) => Promise<unknown>;

export type NativeBridgeView = {
  app: string;
  available: boolean;
  configured: boolean;
  host: string;
  hostLabel: string;
  installed: boolean;
  reason: string;
};

const HOST = /^[\d.a-z-]+$/i;
const APP = /^[\w .+-]+$/;

const absent = (): NativeBridgeView => ({
  app: "",
  available: false,
  configured: false,
  host: "",
  hostLabel: "",
  installed: false,
  reason: STREAM_DISABLED,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const checkStreamHost = (
  host: string
): { error: string } | { value: string } => {
  const trimmed = host.trim();

  if (!trimmed || trimmed.length > 253) {
    return { error: "Enter a host name or an IPv4 address." };
  }

  if (
    trimmed.startsWith("-") ||
    trimmed.startsWith(".") ||
    trimmed.includes("..") ||
    !HOST.test(trimmed)
  ) {
    return { error: "That host is not allowed." };
  }

  return { value: trimmed };
};

export const checkStreamApp = (
  app: string
): { error: string } | { value: string } => {
  const trimmed = app.trim();

  if (!trimmed || trimmed.length > 64) return { error: "Enter an app name." };

  if (
    trimmed.split(/\s+/).some((part) => part.startsWith("-")) ||
    !APP.test(trimmed)
  ) {
    return { error: "That app name is not allowed." };
  }

  return { value: trimmed };
};

export const checkStreamLabel = (
  label: string
): { error: string } | { value: string } => {
  if (!label.trim()) return { value: "" };
  if (
    label.trim().length > 64 ||
    label.trim().startsWith("-") ||
    !APP.test(label.trim())
  ) {
    return { error: "That label is not allowed." };
  }

  return { value: label.trim() };
};

export const readNativeBridge = async (
  invoke?: NativeInvoke
): Promise<NativeBridgeView> => {
  if (!invoke) return absent();

  try {
    const status = await invoke("bridge_status");

    if (!isRecord(status) || status.installed !== true) {
      return {
        ...absent(),
        available: true,
        reason: NATIVE_STREAM_MISSING,
      };
    }

    const saved = await invoke("load_target");
    const host =
      isRecord(saved) && typeof saved.host === "string" ? saved.host : "";
    const app =
      isRecord(saved) && typeof saved.app === "string" ? saved.app : "";
    const hostLabel =
      isRecord(saved) && typeof saved.hostLabel === "string"
        ? saved.hostLabel
        : "";
    const hostOk = checkStreamHost(host);
    const appOk = checkStreamApp(app);
    const configured = "value" in hostOk && "value" in appOk;

    return {
      app: "value" in appOk ? appOk.value : "",
      available: true,
      configured,
      host: "value" in hostOk ? hostOk.value : "",
      hostLabel,
      installed: true,
      reason: configured ? NATIVE_STREAM_READY : NATIVE_STREAM_NEEDS_TARGET,
    };
  } catch {
    return absent();
  }
};

export const tauriInvoke = (scope: object): NativeInvoke | undefined => {
  if (!("__TAURI_INTERNALS__" in scope)) return undefined;

  const internals = scope.__TAURI_INTERNALS__;

  if (typeof internals !== "object" || !internals) return undefined;

  const invoke = "invoke" in internals ? internals.invoke : undefined;

  if (typeof invoke !== "function") return undefined;

  return (command, args) =>
    (invoke as NativeInvoke).call(internals, command, args);
};
