import { type Processes } from "contexts/process/types";
import { isEmbedded } from "utils/embed";
import { PROCESS_DELIMITER } from "utils/constants";

// the messages between yassinOS and the page framing it (yassin.app's room).
// all of them are plain objects with a `type`, see README.md > Embedding

export const EMBED_PROTOCOL = 1;

export const MESSAGE = {
  ESCAPE: "yassinos:escape",
  HELLO: "yassinos:hello",
  INPUT: "yassinos:input",
  OPEN: "yassinos:open",
  PAUSE: "yassinos:pause",
  READY: "yassinos:ready",
  RESUME: "yassinos:resume",
  STATE: "yassinos:state",
} as const;

type EmbedTier = "high" | "low";

type InputKind = "keydown" | "pointerdown" | "pointerup";

type EmbedState = { apps: string[]; focused: string | null };

type HelloMessage = {
  display?: "main";
  protocol: number;
  size?: [number, number];
  tier?: EmbedTier;
  type: typeof MESSAGE.HELLO;
};

type OpenMessage = { app: string; type: typeof MESSAGE.OPEN; url?: string };

type ParentMessage =
  | HelloMessage
  | OpenMessage
  | { type: typeof MESSAGE.PAUSE }
  | { type: typeof MESSAGE.RESUME };

type OsMessage =
  | (EmbedState & { type: typeof MESSAGE.STATE })
  | { kind: InputKind; type: typeof MESSAGE.INPUT }
  | { protocol: typeof EMBED_PROTOCOL; type: typeof MESSAGE.READY }
  | { type: typeof MESSAGE.ESCAPE };

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

export const parseParentMessage = (
  data: unknown
): ParentMessage | undefined => {
  if (!isRecord(data)) return undefined;

  const { type } = data;

  if (type === MESSAGE.PAUSE || type === MESSAGE.RESUME) return { type };

  if (type === MESSAGE.HELLO) {
    const { display, protocol, size, tier } = data;

    if (
      typeof protocol !== "number" ||
      !Number.isInteger(protocol) ||
      protocol < 1 ||
      (display !== undefined && display !== "main") ||
      (size !== undefined && !isSize(size)) ||
      (tier !== undefined && tier !== "high" && tier !== "low")
    ) {
      return undefined;
    }

    return { display, protocol, size, tier, type };
  }

  if (type === MESSAGE.OPEN) {
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

    return { app, type, url };
  }

  return undefined;
};

type ReadContext = {
  development?: boolean;
  parent: MessageEventSource | null;
  // once a hello has been accepted, only its origin is listened to
  pinnedOrigin?: string;
};

export const readParentMessage = (
  { data, origin, source }: Pick<MessageEvent, "data" | "origin" | "source">,
  { development, parent, pinnedOrigin }: ReadContext
): ParentMessage | undefined => {
  if (!parent || source !== parent) return undefined;

  if (
    pinnedOrigin
      ? origin !== pinnedOrigin
      : !isAllowedParentOrigin(origin, development)
  ) {
    return undefined;
  }

  return parseParentMessage(data);
};

const isFramed = (): boolean =>
  typeof window !== "undefined" && window.parent !== window;

// the bridge only runs framed, with ?embed=1
export const isBridgeEnabled = (): boolean => isFramed() && isEmbedded();

let parentOrigin = "";

export const getParentOrigin = (): string => parentOrigin;

export const setParentOrigin = (origin: string): void => {
  parentOrigin ||= origin;
};

// posts to the parent at the origin its hello came from, never to "*"
export const postToParent = (message: OsMessage): boolean => {
  if (!parentOrigin || !isFramed()) return false;

  window.parent.postMessage(message, parentOrigin);

  return true;
};

// a parent that says hello on the iframe's load can beat the desktop's own
// listener (react mounts later), so this one runs from when the page's
// scripts do and keeps the first hello for it
let earlyHello: MessageEvent<unknown> | undefined;

const keepEarlyHello = (event: MessageEvent<unknown>): void => {
  if (
    readParentMessage(event, { parent: window.parent })?.type === MESSAGE.HELLO
  ) {
    earlyHello ??= event;
  }
};

if (isBridgeEnabled()) window.addEventListener("message", keepEarlyHello);

export const takeEarlyHello = (): MessageEvent<unknown> | undefined => {
  const hello = earlyHello;

  earlyHello = undefined;
  window.removeEventListener("message", keepEarlyHello);

  return hello;
};

type PauseListener = (paused: boolean) => void;

const pauseListeners = new Set<PauseListener>();
let parentPaused = false;

// the parent covers us (yassinos:pause until yassinos:resume), so loops like
// the wallpaper and the clock can stop
export const isParentPaused = (): boolean => parentPaused;

export const onParentPauseChange = (listener: PauseListener): (() => void) => {
  pauseListeners.add(listener);

  return () => {
    pauseListeners.delete(listener);
  };
};

export const setParentPaused = (paused: boolean): void => {
  if (paused === parentPaused) return;

  parentPaused = paused;
  pauseListeners.forEach((listener) => listener(paused));
};

const processId = (pid: string): string => pid.split(PROCESS_DELIMITER)[0];

// process ids only (no urls or titles): the open apps in the order they
// opened, and the one in front
export const summarizeState = (
  processes: Processes,
  foregroundId: string
): EmbedState => {
  const open = Object.entries(processes).filter(([, { closing }]) => !closing);
  const hasFocus = open.some(([pid]) => pid === foregroundId);

  return {
    apps: [...new Set(open.map(([pid]) => processId(pid)))],
    // eslint-disable-next-line unicorn/no-null
    focused: hasFocus ? processId(foregroundId) : null,
  };
};

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export const isTextEntry = (element: EventTarget | null): boolean =>
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  (element instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(element.type)) ||
  (element instanceof HTMLElement && element.isContentEditable);

// open menus close themselves on escape: the context menu, start and search
const ESCAPE_HANDLERS = "#__next > nav, #startMenu, #searchMenu";

// an escape that nothing in yassinOS will use, so the parent can have it
export const isUnclaimedEscape = (
  event: KeyboardEvent,
  inDialog = false
): boolean =>
  event.key === "Escape" &&
  !event.repeat &&
  !event.isComposing &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  !inDialog &&
  !document.fullscreenElement &&
  !document.pointerLockElement &&
  !isTextEntry(event.target) &&
  !isTextEntry(document.activeElement) &&
  !document.querySelector(ESCAPE_HANDLERS);

const INPUT_GAP_MS = 25;

// input the parent plays sounds for: no key values, one keydown per press
// (held keys don't repeat), and at most one of a kind every 25 ms
export const createInputReporter = (
  report: (kind: InputKind) => void,
  now: () => number = () => performance.now()
): {
  keyDown: (event: KeyboardEvent) => void;
  keyUp: (event: KeyboardEvent) => void;
  pointer: (kind: InputKind) => void;
  reset: () => void;
} => {
  const held = new Set<string>();
  const last: Partial<Record<InputKind, number>> = {};
  const send = (kind: InputKind): void => {
    const time = now();

    if (time - (last[kind] ?? Number.NEGATIVE_INFINITY) < INPUT_GAP_MS) {
      return;
    }

    last[kind] = time;
    report(kind);
  };

  return {
    keyDown: (event) => {
      const key = event.code || event.key;

      if (event.repeat || event.isComposing || held.has(key)) return;

      held.add(key);
      send("keydown");
    },
    keyUp: (event) => {
      held.delete(event.code || event.key);
    },
    pointer: send,
    reset: () => held.clear(),
  };
};
