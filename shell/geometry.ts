export type Box = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export const MIN_HEIGHT = 180;
export const MIN_WIDTH = 280;
const STEP = 16;
const MIN_VISIBLE = 48;

export const nudgeBox = (box: Box, key: string, shift: boolean): Box => {
  if (shift) {
    if (key === "ArrowRight") return { ...box, width: box.width + STEP };
    if (key === "ArrowLeft") {
      return { ...box, width: Math.max(MIN_WIDTH, box.width - STEP) };
    }
    if (key === "ArrowDown") return { ...box, height: box.height + STEP };
    if (key === "ArrowUp") {
      return { ...box, height: Math.max(MIN_HEIGHT, box.height - STEP) };
    }
    return box;
  }

  if (key === "ArrowRight") return { ...box, x: box.x + STEP };
  if (key === "ArrowLeft") return { ...box, x: box.x - STEP };
  if (key === "ArrowDown") return { ...box, y: box.y + STEP };
  if (key === "ArrowUp") return { ...box, y: box.y - STEP };

  return box;
};

export const clampBox = (
  box: Box,
  display: { height: number; width: number }
): Box => ({
  ...box,
  x: Math.min(
    Math.max(box.x, MIN_VISIBLE - box.width),
    Math.max(0, display.width - MIN_VISIBLE)
  ),
  y: Math.min(Math.max(box.y, 0), Math.max(0, display.height - MIN_VISIBLE)),
});
