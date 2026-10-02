export const ROOM_PROTOCOL = 1;

export const ROOM_HELLO = "yassinos:hello";

export type RoomTier = "high" | "low";

export type RoomHello = {
  display?: "main";
  protocol: typeof ROOM_PROTOCOL;
  size?: [number, number];
  tier?: RoomTier;
  type: typeof ROOM_HELLO;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSize = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(
    (side) => typeof side === "number" && Number.isFinite(side) && side > 0
  );

export const acceptRoomHello = (data: unknown): RoomHello | undefined => {
  if (!isRecord(data) || data.type !== ROOM_HELLO) return undefined;
  if (data.protocol !== ROOM_PROTOCOL) return undefined;
  if (data.display !== undefined && data.display !== "main") return undefined;
  if (data.tier !== undefined && data.tier !== "high" && data.tier !== "low") {
    return undefined;
  }
  if (data.size !== undefined && !isSize(data.size)) return undefined;

  const hello: RoomHello = {
    protocol: ROOM_PROTOCOL,
    type: ROOM_HELLO,
  };

  if (data.display === "main") hello.display = "main";
  if (data.tier === "high" || data.tier === "low") hello.tier = data.tier;
  if (isSize(data.size)) hello.size = data.size;

  return hello;
};
