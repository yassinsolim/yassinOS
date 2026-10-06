import { type RoomPointer } from "shell/protocol";

// the room's controller drives a pointer over the main screen: the parent
// says where it is (in this frame's css pixels) and what it does, and it
// turns into the events a mouse makes on whatever is under it. two quick
// presses on the same spot are a double click, like useDoubleClick expects

const CLICK_SLOP = 8;
const DOUBLE_CLICK_MS = 500;
const FOCUSABLE =
  "a[href], button, input, select, textarea, [contenteditable], [tabindex]";
const CURSOR = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

type Pressed = { target: Element; x: number; y: number };
type LastClick = { at: number; x: number; y: number };

let cursor: HTMLDivElement | undefined;
let hovered: Element | undefined;
let pressed: Pressed | undefined;
let lastClick: LastClick | undefined;

const showCursor = (x: number, y: number): void => {
  if (!cursor?.isConnected) {
    cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = CURSOR;
    Object.assign(cursor.style, {
      left: "0",
      pointerEvents: "none",
      position: "fixed",
      top: "0",
      zIndex: "2147483647",
    });
    document.body.append(cursor);
  }

  cursor.style.display = "";
  cursor.style.transform = `translate(${x - 4}px, ${y - 2}px)`;
};

const fire = (
  target: Element,
  type: string,
  x: number,
  y: number,
  init: MouseEventInit = {}
): boolean => {
  const options = {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    composed: true,
    view: window,
    ...init,
  };
  const pointer = type.startsWith("pointer");

  // a browser without pointer events gets the mouse ones only
  if (pointer && typeof PointerEvent !== "function") return true;

  const event = pointer
    ? new PointerEvent(type, {
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse",
        ...options,
      })
    : new MouseEvent(type, options);

  return target.dispatchEvent(event);
};

const hover = (target: Element | undefined, x: number, y: number): void => {
  if (target === hovered) return;

  const previous = hovered;

  hovered = target;

  if (previous?.isConnected) {
    fire(previous, "pointerout", x, y, { relatedTarget: target });
    fire(previous, "mouseout", x, y, { relatedTarget: target });
  }

  if (target) {
    fire(target, "pointerover", x, y, { relatedTarget: previous });
    fire(target, "mouseover", x, y, { relatedTarget: previous });
  }
};

const scrollerAt = (target: Element | null): Element | undefined => {
  for (let node = target; node; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);

    if (
      (/auto|scroll/.test(overflowY) &&
        node.scrollHeight > node.clientHeight) ||
      (/auto|scroll/.test(overflowX) && node.scrollWidth > node.clientWidth)
    ) {
      return node;
    }
  }

  return document.scrollingElement || undefined;
};

export const handlePadPointer = ({
  dx = 0,
  dy = 0,
  kind,
  x,
  y,
}: RoomPointer): void => {
  if (kind === "hide") {
    if (cursor) cursor.style.display = "none";
    hover(undefined, x, y);
    pressed = undefined;
    lastClick = undefined;
    return;
  }

  showCursor(x, y);

  const target = document.elementFromPoint(x, y);

  if (!target) return;

  const buttons = pressed ? 1 : 0;

  if (kind === "move") {
    hover(target, x, y);
    fire(target, "pointermove", x, y, { buttons });
    fire(target, "mousemove", x, y, { buttons });
  } else if (kind === "down") {
    pressed = { target, x, y };
    fire(target, "pointerdown", x, y, { buttons: 1 });

    // a real press moves the focus too, unless the page stops it
    if (fire(target, "mousedown", x, y, { buttons: 1 })) {
      target.closest<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
    }
  } else if (kind === "up") {
    const down = pressed;

    pressed = undefined;
    fire(target, "pointerup", x, y);
    fire(target, "mouseup", x, y);

    if (
      down &&
      Math.hypot(x - down.x, y - down.y) < CLICK_SLOP &&
      (down.target === target || down.target.contains(target))
    ) {
      const now = performance.now();
      const double =
        lastClick &&
        now - lastClick.at < DOUBLE_CLICK_MS &&
        Math.hypot(x - lastClick.x, y - lastClick.y) < CLICK_SLOP;

      fire(down.target, "click", x, y, { detail: double ? 2 : 1 });
      if (double) fire(down.target, "dblclick", x, y, { detail: 2 });
      lastClick = double ? undefined : { at: now, x, y };
    }
  } else if (kind === "menu") {
    fire(target, "pointerdown", x, y, { button: 2, buttons: 2 });
    fire(target, "mousedown", x, y, { button: 2, buttons: 2 });
    fire(target, "pointerup", x, y, { button: 2 });
    fire(target, "mouseup", x, y, { button: 2 });
    fire(target, "contextmenu", x, y, { button: 2 });
  } else if (
    target.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        deltaX: dx,
        deltaY: dy,
      })
    )
  ) {
    // an untrusted wheel doesn't scroll by itself
    scrollerAt(target)?.scrollBy({ left: dx, top: dy });
  }
};
