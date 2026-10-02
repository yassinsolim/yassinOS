export const ROOM_PROTOCOL = 1;

export const ROOM_MESSAGE = {
  BRIDGE: "yassinos:bridge",
  ESCAPE: "yassinos:escape",
  HANDOFF: "yassinos:handoff",
  HELLO: "yassinos:hello",
  INPUT: "yassinos:input",
  OPEN: "yassinos:open",
  PAUSE: "yassinos:pause",
  READY: "yassinos:ready",
  RESUME: "yassinos:resume",
  SESSION: "yassinos:session",
  SESSIONS: "yassinos:sessions",
  STATE: "yassinos:state",
} as const;

export const ROOM_HELLO = ROOM_MESSAGE.HELLO;

export type RoomTier = "high" | "low";

export type EmbedHello = {
  display?: "main";
  protocol: number;
  size?: [number, number];
  tier?: RoomTier;
  type: typeof ROOM_HELLO;
};

export type RoomHello = EmbedHello & { protocol: typeof ROOM_PROTOCOL };

export type RoomParentMessage =
  | EmbedHello
  | { app: string; type: typeof ROOM_MESSAGE.OPEN; url?: string }
  | { type: typeof ROOM_MESSAGE.PAUSE }
  | { type: typeof ROOM_MESSAGE.RESUME };

const ROOM_ORIGINS = new Set(["https://yassin.app", "https://www.yassin.app"]);
const DEVELOPMENT_ORIGIN =
  /^http:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(?::\d{1,5})?$/;
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const MAX_APP_LENGTH = 64;
const MAX_URL_LENGTH = 2048;

export const isAllowedParentOrigin = (
  origin: string,
  development = IS_DEVELOPMENT
): boolean =>
  ROOM_ORIGINS.has(origin) || (development && DEVELOPMENT_ORIGIN.test(origin));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSize = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(
    (side) => typeof side === "number" && Number.isFinite(side) && side > 0
  );

const isTier = (value: unknown): value is RoomTier =>
  value === "high" || value === "low";

export const acceptEmbedHello = (data: unknown): EmbedHello | undefined => {
  if (!isRecord(data) || data.type !== ROOM_HELLO) return undefined;

  const { display, protocol, size, tier } = data;

  if (
    typeof protocol !== "number" ||
    !Number.isInteger(protocol) ||
    protocol < 1 ||
    (display !== undefined && display !== "main") ||
    (size !== undefined && !isSize(size)) ||
    (tier !== undefined && !isTier(tier))
  ) {
    return undefined;
  }

  const hello: EmbedHello = { protocol, type: ROOM_HELLO };

  if (display === "main") hello.display = "main";
  if (isSize(size)) hello.size = size;
  if (isTier(tier)) hello.tier = tier;

  return hello;
};

export const acceptRoomHello = (data: unknown): RoomHello | undefined => {
  const hello = acceptEmbedHello(data);

  if (hello?.protocol !== ROOM_PROTOCOL) return undefined;

  return { ...hello, protocol: ROOM_PROTOCOL };
};

export const parseRoomParent = (
  data: unknown
): RoomParentMessage | undefined => {
  if (!isRecord(data)) return undefined;

  const { type } = data;

  if (type === ROOM_MESSAGE.PAUSE || type === ROOM_MESSAGE.RESUME) {
    return { type };
  }

  if (type === ROOM_MESSAGE.HELLO) return acceptEmbedHello(data);

  if (type === ROOM_MESSAGE.OPEN) {
    const { app, url } = data;

    if (
      typeof app !== "string" ||
      !app ||
      app.length > MAX_APP_LENGTH ||
      (url !== undefined &&
        (typeof url !== "string" || url.length > MAX_URL_LENGTH))
    ) {
      return undefined;
    }

    return { app, type, url: typeof url === "string" ? url : undefined };
  }

  return undefined;
};

const SECRET_KEY = /^(?:credential|passwd|password|pin|secret|token)$/i;
const SESSION_DETAIL = /^[\w .,'-]{0,160}$/;

const hasSecretKey = (record: Record<string, unknown>): boolean =>
  Object.keys(record).some((key) => SECRET_KEY.test(key));

const remoteKind = (value: unknown): "lab" | "stream" | undefined => {
  if (value === "lab" || value === "stream") return value;

  return undefined;
};

export type BridgeOffer = {
  providers: ("lab" | "stream")[];
};

export type SessionReport = {
  detail: string;
  provider: "lab" | "stream";
  status: "error" | "resumed";
};

export const acceptBridgeOffer = (data: unknown): BridgeOffer | undefined => {
  if (!isRecord(data) || data.type !== ROOM_MESSAGE.BRIDGE) return undefined;
  if (data.protocol !== ROOM_PROTOCOL || hasSecretKey(data)) return undefined;
  if (!Array.isArray(data.providers)) return undefined;

  const providers: ("lab" | "stream")[] = [];

  for (const item of data.providers) {
    const kind = remoteKind(item);

    if (!kind || providers.includes(kind)) return undefined;

    providers.push(kind);
  }

  if (providers.length === 0) return undefined;

  return { providers };
};

export const acceptSessionReport = (
  data: unknown
): SessionReport | undefined => {
  if (!isRecord(data) || data.type !== ROOM_MESSAGE.SESSION) return undefined;
  if (data.protocol !== ROOM_PROTOCOL || hasSecretKey(data)) return undefined;

  const provider = remoteKind(data.provider);

  if (!provider) return undefined;
  if (data.status !== "error" && data.status !== "resumed") return undefined;
  if (data.detail !== undefined && typeof data.detail !== "string") {
    return undefined;
  }
  if (typeof data.detail === "string" && !SESSION_DETAIL.test(data.detail)) {
    return undefined;
  }

  return {
    detail: typeof data.detail === "string" ? data.detail : "",
    provider,
    status: data.status,
  };
};

export const acceptHandoffCommand = (
  data: unknown
): { provider: "lab" | "stream" } | undefined => {
  if (!isRecord(data) || data.type !== ROOM_MESSAGE.HANDOFF) return undefined;
  if (data.protocol !== ROOM_PROTOCOL || hasSecretKey(data)) return undefined;

  const provider = remoteKind(data.provider);

  if (!provider) return undefined;

  return { provider };
};
