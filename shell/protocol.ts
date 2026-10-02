export const ROOM_PROTOCOL = 1;

export const ROOM_MESSAGE = {
  ESCAPE: "yassinos:escape",
  HELLO: "yassinos:hello",
  INPUT: "yassinos:input",
  OPEN: "yassinos:open",
  PAUSE: "yassinos:pause",
  READY: "yassinos:ready",
  RESUME: "yassinos:resume",
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
