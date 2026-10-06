import { type Processes } from "contexts/process/types";
import {
  MESSAGE,
  createInputReporter,
  isAllowedParentOrigin,
  isTextEntry,
  isUnclaimedEscape,
  parseParentMessage,
  readParentMessage,
  summarizeState,
} from "utils/embedBridge";

/* eslint-disable sonarjs/no-clear-text-protocols */
// origin, allowed in development, allowed in production
const ORIGIN_CASES: [string, boolean, boolean][] = [
  ["https://yassin.app", true, true],
  ["https://www.yassin.app", true, true],
  ["http://localhost:3000", true, false],
  ["http://localhost", true, false],
  ["http://127.0.0.1:5173", true, false],
  ["http://192.168.1.20:8080", true, false],
  ["http://yassin.app", false, false],
  ["https://yassin.app.evil.com", false, false],
  ["https://evilyassin.app", false, false],
  ["https://os.yassin.app", false, false],
  ["https://localhost:3000", false, false],
  ["http://localhost.evil.com", false, false],
  ["http://room.localhost:3000", false, false],
  ["http://192.168.1.1.nip.io", false, false],
  ["http://10.0.0.2:3000", false, false],
  ["null", false, false],
  ["", false, false],
];
const LOCAL_ORIGIN = "http://localhost:5173";
/* eslint-enable sonarjs/no-clear-text-protocols */

const HELLO = {
  display: "main",
  protocol: 1,
  size: [1600, 900],
  tier: "high",
  type: MESSAGE.HELLO,
};

const PARENT = {} as MessageEventSource;
const PAUSE = { type: MESSAGE.PAUSE };

const messageEvent = (
  origin: string,
  source: MessageEventSource | null = PARENT,
  data: unknown = PAUSE
): Pick<MessageEvent, "data" | "origin" | "source"> => ({
  data,
  origin,
  source,
});

const pressOn = (
  target: HTMLElement,
  init: KeyboardEventInit = {}
): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    key: "Escape",
    ...init,
  });

  target.dispatchEvent(event);

  return event;
};

const createElement = (
  tag: string,
  attributes: Record<string, string> = {}
): HTMLElement => {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([name, value]) =>
    element.setAttribute(name, value)
  );

  return element;
};

const keyDown = (code: string, init: KeyboardEventInit = {}): KeyboardEvent =>
  new KeyboardEvent("keydown", { code, key: code, ...init });

describe("parent origins", () => {
  test.each(ORIGIN_CASES)(
    "%s: development %p, production %p",
    (origin, development, production) => {
      expect(isAllowedParentOrigin(origin, true)).toBe(development);
      expect(isAllowedParentOrigin(origin, false)).toBe(production);
    }
  );
});

describe("parent message types", () => {
  test.each([
    HELLO,
    { protocol: 1, type: MESSAGE.HELLO },
    { ...HELLO, protocol: 2 },
    { ...HELLO, tier: "low" },
    { type: MESSAGE.PAUSE },
    { type: MESSAGE.RESUME },
    { app: "Portfolio", type: MESSAGE.OPEN },
    { app: "PDF", type: MESSAGE.OPEN, url: "/Users/Public/Desktop/Resume.pdf" },
    { kind: "move", type: MESSAGE.POINTER, x: 120, y: 80.5 },
    { kind: "down", type: MESSAGE.POINTER, x: 0, y: 0 },
    { dx: 0, dy: -240, kind: "scroll", type: MESSAGE.POINTER, x: 10, y: 10 },
  ])("accepts %j", (message) =>
    expect(parseParentMessage(message)).toMatchObject(message)
  );

  test.each([
    undefined,
    // eslint-disable-next-line unicorn/no-null
    null,
    "yassinos:pause",
    ["yassinos:pause"],
    {},
    { type: "yassinos:unknown" },
    { protocol: 1, type: MESSAGE.READY },
    { type: MESSAGE.ESCAPE },
    { ...HELLO, protocol: undefined },
    { ...HELLO, protocol: "1" },
    { ...HELLO, protocol: 0 },
    { ...HELLO, protocol: 1.5 },
    { ...HELLO, display: "top" },
    { ...HELLO, size: [1600] },
    { ...HELLO, size: [1600, -900] },
    { ...HELLO, size: "1600x900" },
    { ...HELLO, tier: "ultra" },
    { type: MESSAGE.OPEN },
    { app: "", type: MESSAGE.OPEN },
    { app: 42, type: MESSAGE.OPEN },
    { app: "Portfolio", type: MESSAGE.OPEN, url: 42 },
    { app: "x".repeat(65), type: MESSAGE.OPEN },
    { type: MESSAGE.POINTER, x: 1, y: 1 },
    { kind: "drag", type: MESSAGE.POINTER, x: 1, y: 1 },
    { kind: "move", type: MESSAGE.POINTER, x: "1", y: 1 },
    { kind: "move", type: MESSAGE.POINTER, x: Number.NaN, y: 1 },
    { kind: "move", type: MESSAGE.POINTER, x: 1, y: Infinity },
    { kind: "move", type: MESSAGE.POINTER, x: 1e6, y: 1 },
    { kind: "scroll", type: MESSAGE.POINTER, x: 1, y: 1 },
    { dx: 0, dy: "down", kind: "scroll", type: MESSAGE.POINTER, x: 1, y: 1 },
  ])("rejects %j", (message) =>
    expect(parseParentMessage(message)).toBeUndefined()
  );

  test("keeps only the fields it knows", () =>
    expect(
      parseParentMessage({ ...HELLO, extra: "<script>" })
    ).not.toHaveProperty("extra"));

  test("a pointer that isn't scrolling carries no deltas", () =>
    expect(
      parseParentMessage({
        dx: 5,
        dy: 5,
        kind: "move",
        type: MESSAGE.POINTER,
        x: 1,
        y: 1,
      })
    ).toEqual({ kind: "move", type: MESSAGE.POINTER, x: 1, y: 1 }));
});

describe("reading parent messages", () => {
  test("needs the parent as the source", () => {
    expect(
      readParentMessage(messageEvent("https://yassin.app"), { parent: PARENT })
    ).toEqual(PAUSE);
    expect(
      readParentMessage(
        messageEvent("https://yassin.app", {} as MessageEventSource),
        { parent: PARENT }
      )
    ).toBeUndefined();
    expect(
      readParentMessage(
        // eslint-disable-next-line unicorn/no-null
        messageEvent("https://yassin.app", null),
        { parent: PARENT }
      )
    ).toBeUndefined();
  });

  test("isn't framed without a parent", () =>
    expect(
      // eslint-disable-next-line unicorn/no-null
      readParentMessage(messageEvent("https://yassin.app"), { parent: null })
    ).toBeUndefined());

  test("needs an allowed origin", () => {
    expect(
      readParentMessage(messageEvent("https://evil.example"), {
        parent: PARENT,
      })
    ).toBeUndefined();
    expect(
      readParentMessage(messageEvent(LOCAL_ORIGIN), {
        development: false,
        parent: PARENT,
      })
    ).toBeUndefined();
    expect(
      readParentMessage(messageEvent(LOCAL_ORIGIN), {
        development: true,
        parent: PARENT,
      })
    ).toEqual(PAUSE);
  });

  test("only listens to the hello's origin once it's pinned", () => {
    const pinned = { parent: PARENT, pinnedOrigin: "https://yassin.app" };

    expect(
      readParentMessage(messageEvent("https://yassin.app"), pinned)
    ).toEqual(PAUSE);
    expect(
      readParentMessage(messageEvent("https://www.yassin.app"), pinned)
    ).toBeUndefined();
  });

  test("still checks the type", () =>
    expect(
      readParentMessage(
        messageEvent("https://yassin.app", PARENT, { type: "x" }),
        { parent: PARENT }
      )
    ).toBeUndefined());
});

describe("state", () => {
  const processes = {
    "FileExplorer__/Users/Public": {},
    "FileExplorer__/Users/Public/Documents": {},
    Portfolio: {},
    Terminal: { closing: true },
  } as unknown as Processes;

  test("lists process ids only, once each, without closing apps", () =>
    expect(summarizeState(processes, "FileExplorer__/Users/Public")).toEqual({
      apps: ["FileExplorer", "Portfolio"],
      focused: "FileExplorer",
    }));

  test("has no focus on the desktop or a closing app", () => {
    expect(summarizeState(processes, "").focused).toBeNull();
    expect(summarizeState(processes, "Terminal").focused).toBeNull();
  });
});

describe("escape", () => {
  afterEach(() => document.body.replaceChildren());

  test("on the desktop, goes to the parent", () =>
    expect(isUnclaimedEscape(pressOn(document.body))).toBe(true));

  test("not other keys, repeats or combinations", () => {
    expect(isUnclaimedEscape(pressOn(document.body, { key: "Enter" }))).toBe(
      false
    );
    expect(isUnclaimedEscape(pressOn(document.body, { repeat: true }))).toBe(
      false
    );
    expect(isUnclaimedEscape(pressOn(document.body, { shiftKey: true }))).toBe(
      false
    );
  });

  test("not in text inputs", () => {
    const input = createElement("input");

    document.body.append(input);
    expect(isUnclaimedEscape(pressOn(input))).toBe(false);
  });

  test("not while a menu that closes on escape is open", () => {
    document.body.append(createElement("nav", { id: "startMenu" }));
    expect(isUnclaimedEscape(pressOn(document.body))).toBe(false);
  });

  test("not in a dialog", () =>
    expect(isUnclaimedEscape(pressOn(document.body), true)).toBe(false));
});

describe("text entry", () => {
  beforeAll(() => {
    // jsdom doesn't implement it
    Object.defineProperty(HTMLElement.prototype, "isContentEditable", {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute("contenteditable") === "true";
      },
    });
  });

  test.each([
    [createElement("input"), true],
    [createElement("input", { type: "search" }), true],
    [createElement("textarea"), true],
    [createElement("select"), true],
    [createElement("div", { contenteditable: "true" }), true],
    [createElement("input", { type: "checkbox" }), false],
    [createElement("input", { type: "range" }), false],
    [createElement("button"), false],
    [createElement("div"), false],
  ])("%s is %p", (target, expected) =>
    expect(isTextEntry(target)).toBe(expected)
  );
});

describe("input", () => {
  let time = 0;
  let reported: string[] = [];
  let input: ReturnType<typeof createInputReporter>;

  beforeEach(() => {
    time = 0;
    reported = [];
    input = createInputReporter(
      (kind) => reported.push(kind),
      () => time
    );
  });

  test("a held key reports once", () => {
    input.keyDown(keyDown("KeyA"));
    time += 100;
    input.keyDown(keyDown("KeyA", { repeat: true }));
    time += 100;
    input.keyDown(keyDown("KeyA"));
    input.keyUp(keyDown("KeyA"));
    time += 100;
    input.keyDown(keyDown("KeyA"));

    expect(reported).toEqual(["keydown", "keydown"]);
  });

  test("keeps kinds apart and spaces them out", () => {
    input.pointer("pointerdown");
    input.pointer("pointerup");
    input.pointer("pointerdown");
    time += 30;
    input.pointer("pointerdown");

    expect(reported).toEqual(["pointerdown", "pointerup", "pointerdown"]);
  });

  test("forgets held keys when focus leaves", () => {
    input.keyDown(keyDown("KeyB"));
    input.reset();
    time += 100;
    input.keyDown(keyDown("KeyB"));

    expect(reported).toEqual(["keydown", "keydown"]);
  });
});
