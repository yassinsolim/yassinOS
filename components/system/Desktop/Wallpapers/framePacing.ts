// Lets the page pause a wallpaper worker and cap its frame rate, whatever
// the wallpaper is: requestAnimationFrame callbacks are held while paused
// and spaced out to the cap. Import it first in a wallpaper worker, so its
// listener runs before the wallpaper's own and keeps these messages from it.

export type FramePacing = { maxFps?: number; paused?: boolean };
export type FramePacingMessage = { framePacing: FramePacing };

export const isFramePacingMessage = (
  data: unknown
): data is FramePacingMessage =>
  typeof data === "object" && data !== null && "framePacing" in data;

const scope = globalThis as unknown as {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<unknown>) => void
  ) => void;
  cancelAnimationFrame?: (id: number) => void;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
};
const request = scope.requestAnimationFrame?.bind(globalThis);
const cancel = scope.cancelAnimationFrame?.bind(globalThis);

if (request && cancel) {
  let paused = false;
  let minInterval = 0;
  let lastFrame = 0;
  let nextId = 1;
  // our ids to the browser's, so cancelling still works after a re-request
  const live = new Map<number, number>();
  const held = new Map<number, FrameRequestCallback>();

  const schedule = (id: number, callback: FrameRequestCallback): void => {
    const run = (time: number): void => {
      if (!live.has(id)) return;

      if (paused) {
        live.delete(id);
        held.set(id, callback);

        return;
      }

      // Under the cap: wait for a later frame
      if (minInterval && time - lastFrame < minInterval - 1) {
        live.set(id, request(run));

        return;
      }

      lastFrame = time;
      live.delete(id);
      callback(time);
    };

    live.set(id, request(run));
  };

  scope.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = nextId;

    nextId += 1;
    schedule(id, callback);

    return id;
  };
  scope.cancelAnimationFrame = (id: number): void => {
    const browserId = live.get(id);

    if (browserId !== undefined) cancel(browserId);
    live.delete(id);
    held.delete(id);
  };

  scope.addEventListener("message", (event: MessageEvent<unknown>) => {
    // only the page that made this worker talks to it (no origin, or ours)
    if (event.origin && event.origin !== globalThis.location.origin) return;

    const { data } = event;

    if (!isFramePacingMessage(data)) return;

    event.stopImmediatePropagation();

    const { maxFps, paused: nextPaused } = data.framePacing;

    if (maxFps !== undefined) minInterval = maxFps > 0 ? 1000 / maxFps : 0;

    if (nextPaused !== undefined) {
      paused = nextPaused;

      if (!paused) {
        const resumed = [...held];

        held.clear();
        resumed.forEach(([id, callback]) => schedule(id, callback));
      }
    }
  });
}
