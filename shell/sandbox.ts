import { MAX_MESSAGE_BYTES } from "shell/storage";
import { WASM_STEP } from "shell/wasmStep";

export const SANDBOX_PROTOCOL = 1;

export const SANDBOX_MESSAGE = {
  DENY: "shell:deny",
  GRANT: "shell:grant",
  PAUSE: "shell:pause",
  READY: "shell:ready",
  REQUEST: "shell:request",
  RESULT: "shell:result",
  RESUME: "shell:resume",
} as const;

// scripts only. allow-same-origin would put the guest on the parent origin.
export const SANDBOX_TOKENS = "allow-scripts";

export const OPAQUE_ORIGIN = "null";

const REQUEST_ID = /^[\w-]{1,64}$/;
const CAPABILITY_NAME = /^[a-z-]{1,32}$/;
const APP_ID = /^[a-z][a-z0-9-]{0,31}$/;

export type HostBinding = {
  appId: string;
  contentWindow: unknown;
  granted: readonly string[];
};

export type GuestDecision =
  | { appId: string; kind: "ready" }
  | { body?: unknown; capability: string; id: string; kind: "allow" }
  | { capability: string; id: string; kind: "deny" }
  | { kind: "drop"; reason: "app" | "origin" | "schema" | "source" };

export type ParentReply =
  | {
      appId: string;
      capabilities: string[];
      protocol: typeof SANDBOX_PROTOCOL;
      type: typeof SANDBOX_MESSAGE.GRANT;
    }
  | {
      error?: string;
      files?: string[];
      id: string;
      module?: number[];
      ok: boolean;
      protocol: typeof SANDBOX_PROTOCOL;
      text?: string;
      type: typeof SANDBOX_MESSAGE.RESULT;
    }
  | {
      capability: string;
      id: string;
      protocol: typeof SANDBOX_PROTOCOL;
      type: typeof SANDBOX_MESSAGE.DENY;
    }
  | {
      protocol: typeof SANDBOX_PROTOCOL;
      type: typeof SANDBOX_MESSAGE.PAUSE;
    }
  | {
      protocol: typeof SANDBOX_PROTOCOL;
      type: typeof SANDBOX_MESSAGE.RESUME;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sandboxTokensAllowParentOrigin = (tokens: string): boolean => {
  const parts = new Set(tokens.split(/\s+/).filter(Boolean));

  return parts.has("allow-same-origin") && parts.has("allow-scripts");
};

type GuestMessage =
  | { appId: string; type: typeof SANDBOX_MESSAGE.READY }
  | {
      body?: unknown;
      capability: string;
      id: string;
      type: typeof SANDBOX_MESSAGE.REQUEST;
    };

const parseGuestMessage = (data: unknown): GuestMessage | undefined => {
  if (!isRecord(data) || data.protocol !== SANDBOX_PROTOCOL) return undefined;

  if (data.type === SANDBOX_MESSAGE.READY) {
    if (typeof data.appId !== "string" || !APP_ID.test(data.appId)) {
      return undefined;
    }

    return { appId: data.appId, type: SANDBOX_MESSAGE.READY };
  }

  if (data.type === SANDBOX_MESSAGE.REQUEST) {
    if (
      typeof data.id !== "string" ||
      !REQUEST_ID.test(data.id) ||
      typeof data.capability !== "string" ||
      !CAPABILITY_NAME.test(data.capability)
    ) {
      return undefined;
    }

    if (data.body !== undefined) {
      let encoded = "";

      try {
        encoded = JSON.stringify(data.body);
      } catch {
        return undefined;
      }

      if (encoded.length > MAX_MESSAGE_BYTES) return undefined;
    }

    const message: Extract<
      GuestMessage,
      { type: typeof SANDBOX_MESSAGE.REQUEST }
    > = {
      capability: data.capability,
      id: data.id,
      type: SANDBOX_MESSAGE.REQUEST,
    };

    if (data.body !== undefined) message.body = data.body;

    return message;
  }

  return undefined;
};

export const authorizeGuest = (
  data: unknown,
  event: { origin: string; source: unknown },
  host: HostBinding
): GuestDecision => {
  if (event.source !== host.contentWindow) {
    return { kind: "drop", reason: "source" };
  }

  if (event.origin !== OPAQUE_ORIGIN) {
    return { kind: "drop", reason: "origin" };
  }

  const message = parseGuestMessage(data);

  if (!message) return { kind: "drop", reason: "schema" };

  if (message.type === SANDBOX_MESSAGE.READY) {
    if (message.appId !== host.appId) return { kind: "drop", reason: "app" };

    return { appId: message.appId, kind: "ready" };
  }

  if (!host.granted.includes(message.capability)) {
    return {
      capability: message.capability,
      id: message.id,
      kind: "deny",
    };
  }

  const allowed: Extract<GuestDecision, { kind: "allow" }> = {
    capability: message.capability,
    id: message.id,
    kind: "allow",
  };

  if (message.body !== undefined) allowed.body = message.body;

  return allowed;
};

export const replyToGuest = (
  decision: GuestDecision,
  granted: readonly string[],
  wasmModule: readonly number[] = WASM_STEP
): ParentReply | undefined => {
  if (decision.kind === "drop") return undefined;

  if (decision.kind === "ready") {
    return {
      appId: decision.appId,
      capabilities: [...granted],
      protocol: SANDBOX_PROTOCOL,
      type: SANDBOX_MESSAGE.GRANT,
    };
  }

  if (decision.kind === "deny") {
    return {
      capability: decision.capability,
      id: decision.id,
      protocol: SANDBOX_PROTOCOL,
      type: SANDBOX_MESSAGE.DENY,
    };
  }

  const result: ParentReply = {
    id: decision.id,
    ok: true,
    protocol: SANDBOX_PROTOCOL,
    type: SANDBOX_MESSAGE.RESULT,
  };

  if (decision.capability !== "wasm-bench") return result;

  return { ...result, module: [...wasmModule] };
};

export const pauseMessage = (): ParentReply => ({
  protocol: SANDBOX_PROTOCOL,
  type: SANDBOX_MESSAGE.PAUSE,
});

export const resumeMessage = (): ParentReply => ({
  protocol: SANDBOX_PROTOCOL,
  type: SANDBOX_MESSAGE.RESUME,
});
