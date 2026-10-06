import { MESSAGE } from "utils/embedBridge";
import { handlePadPointer } from "utils/padPointer";

type Kind = "down" | "hide" | "menu" | "move" | "scroll" | "up";

const send = (kind: Kind, x = 10, y = 10, dx = 0, dy = 0): void =>
  handlePadPointer({ dx, dy, kind, type: MESSAGE.POINTER, x, y });

// jsdom has neither pointer events, hit testing nor element scrolling
class FakePointerEvent extends MouseEvent {}

const scrollBy = jest.fn();
let under: Element | undefined;

beforeAll(() => {
  Object.assign(globalThis, { PointerEvent: FakePointerEvent });
  Object.assign(document, { elementFromPoint: () => under });
  Object.assign(Element.prototype, { scrollBy });
});

beforeEach(() => {
  document.body.innerHTML = "";
  scrollBy.mockClear();
  send("hide");
});

const button = (): HTMLButtonElement => {
  const element = document.createElement("button");

  document.body.append(element);
  under = element;

  return element;
};

const record = (element: Element, types: string[]): string[] => {
  const seen: string[] = [];

  types.forEach((type) =>
    element.addEventListener(type, (event) =>
      seen.push(`${type}:${(event as MouseEvent).detail}`)
    )
  );

  return seen;
};

describe("the room's controller pointer", () => {
  test("a press and release in place is a click, like a mouse's", () => {
    const target = button();
    const seen = record(target, [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "click",
    ]);

    send("move");
    send("down");
    send("up");

    expect(seen).toEqual([
      "pointerdown:0",
      "mousedown:0",
      "pointerup:0",
      "mouseup:0",
      "click:1",
    ]);
    expect(document.activeElement).toBe(target);
  });

  test("two quick presses on one spot are a double click", () => {
    const seen = record(button(), ["click", "dblclick"]);

    ["down", "up", "down", "up"].forEach((kind) => send(kind as Kind));

    expect(seen).toEqual(["click:1", "click:2", "dblclick:2"]);
  });

  test("moving away while pressed isn't a click", () => {
    const seen = record(button(), ["click"]);

    send("down", 10, 10);
    send("up", 40, 10);

    expect(seen).toEqual([]);
  });

  test("hovering goes over and out of what's under it", () => {
    const first = button();
    const seen = record(first, ["mouseover", "mouseout", "mousemove"]);

    send("move");
    button();
    send("move", 12, 12);

    expect(seen).toEqual(["mouseover:0", "mousemove:0", "mouseout:0"]);
  });

  test("the menu button opens a context menu", () => {
    const target = button();
    let right = -1;

    target.addEventListener("contextmenu", (event) => {
      right = event.button;
    });
    send("menu");

    expect(right).toBe(2);
  });

  test("scrolls what's under it unless a wheel handler takes it", () => {
    const target = button();

    Object.defineProperties(document.body, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 400 },
    });
    document.body.style.overflowY = "auto";
    send("scroll", 10, 10, 0, 120);
    expect(scrollBy).toHaveBeenCalledWith({ left: 0, top: 120 });

    target.addEventListener("wheel", (event) => event.preventDefault());
    send("scroll", 10, 10, 0, 120);
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });

  test("shows a cursor where it is and hides it", () => {
    button();
    send("move", 50, 60);

    const cursor = document.body.lastElementChild as HTMLElement;

    expect(cursor.matches('[aria-hidden="true"]')).toBe(true);
    expect(cursor.style.transform).toBe("translate(46px, 58px)");
    send("hide");
    expect(cursor.style.display).toBe("none");
  });
});
