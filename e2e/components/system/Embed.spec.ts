import { type Server, createServer } from "http";
import { type AddressInfo } from "net";
import { type Page, expect, test } from "@playwright/test";
import {
  BACKGROUND_CANVAS_SELECTOR,
  DESKTOP_ENTRIES_SELECTOR,
  START_BUTTON_SELECTOR,
  START_MENU_SELECTOR,
  TASKBAR_SELECTOR,
  WINDOW_SELECTOR,
} from "e2e/constants";

type Received = { data: { type?: string } & Record<string, unknown> };

declare global {
  interface Window {
    received: Received[];
    send: (message: unknown) => void;
  }
}

const ROOM_QUERY = "embed=1&display=main&protocol=1&wallpaper=span";
const ANIMATED_QUERY = "embed=1&display=main&protocol=1";
const HELLO = {
  display: "main",
  protocol: 1,
  size: [1600, 900],
  tier: "high",
  type: "yassinos:hello",
};
// the room's wallpaper strip, clear of the icons and the taskbar
const WALLPAPER_CLIP = { height: 220, width: 800, x: 700, y: 60 };

// a stand-in for yassin.app's room: frames the desktop at 1600 x 900 and keeps
// what it posts back
const parentPage = (
  osUrl: string,
  helloOnLoad: boolean
): string => `<!doctype html>
<body style="margin: 0">
  <iframe id="os" style="border: 0; display: block; height: 900px; width: 1600px"></iframe>
  <script>
    const osUrl = ${JSON.stringify(osUrl)};
    const os = document.getElementById("os");

    window.received = [];
    window.addEventListener("message", ({ data, origin, source }) => {
      if (source === os.contentWindow) window.received.push({ data, origin });
    });
    window.send = (message) =>
      os.contentWindow.postMessage(message, new URL(osUrl).origin);
    os.addEventListener("load", () => {
      if (${helloOnLoad}) window.send(${JSON.stringify(HELLO)});
    });
    os.src = osUrl;
  </script>
</body>`;

let server: Server;
let parentOrigin = "";
// the same local server, under a name that isn't on the list (chromium
// resolves *.localhost to loopback itself)
let notAllowedOrigin = "";

test.skip(
  Boolean(process.env.CI),
  "local parents are only allowed in development builds, CI serves a production one"
);

test.describe.configure({ timeout: 90_000 });

test.use({ viewport: { height: 900, width: 1600 } });

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const [, query = ""] = (request.url || "").split("?");
    const params = new URLSearchParams(query);

    response.setHeader("Content-Type", "text/html");
    response.end(parentPage(params.get("os") || "", params.has("helloOnLoad")));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address() as AddressInfo;

  parentOrigin = `http://127.0.0.1:${port}`;
  notAllowedOrigin = `http://room.localhost:${port}`;
});

test.afterAll(
  () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
);

const osFrame = (page: Page): ReturnType<Page["frameLocator"]> =>
  page.frameLocator("#os");

const loadRoom = async (
  page: Page,
  baseURL = "",
  query = ROOM_QUERY,
  origin = parentOrigin,
  helloOnLoad = false
): Promise<void> => {
  const osUrl = `${baseURL}/?${query}`;

  await page.goto(
    `${origin}/?os=${encodeURIComponent(osUrl)}${helloOnLoad ? "&helloOnLoad" : ""}`
  );
  await expect(osFrame(page).locator(TASKBAR_SELECTOR)).toBeVisible();
  await expect(
    osFrame(page).locator(DESKTOP_ENTRIES_SELECTOR).first()
  ).toBeVisible();
};

const received = (page: Page, type?: string): Promise<Received[]> =>
  page.evaluate(
    (messageType) =>
      window.received.filter(
        ({ data }) => !messageType || data?.type === messageType
      ),
    type
  );

const send = (page: Page, message: unknown): Promise<void> =>
  page.evaluate((data) => window.send(data), message);

// the parent can't know when the desktop listens, so it repeats hello
const helloUntilReady = async (page: Page): Promise<void> =>
  expect(async () => {
    await send(page, HELLO);
    expect(await received(page, "yassinos:ready")).not.toHaveLength(0);
  }).toPass({ intervals: [250], timeout: 30_000 });

const wallpaperFrame = (page: Page): Promise<Buffer> =>
  page.screenshot({ clip: WALLPAPER_CLIP });

test("says ready after hello, and nothing before it", async ({
  baseURL,
  page,
}) => {
  await loadRoom(page, baseURL);
  await expect(osFrame(page).getByRole("timer")).toBeVisible();

  expect(await received(page)).toEqual([]);

  await helloUntilReady(page);

  const [ready] = await received(page);

  expect(ready).toEqual({
    data: { protocol: 1, type: "yassinos:ready" },
    origin: new URL(baseURL || "").origin,
  });

  await expect(async () =>
    expect((await received(page, "yassinos:state"))[0]?.data).toEqual({
      apps: [],
      // eslint-disable-next-line unicorn/no-null
      focused: null,
      type: "yassinos:state",
    })
  ).toPass();
});

test("one hello when the frame loads is enough", async ({ baseURL, page }) => {
  await loadRoom(page, baseURL, ROOM_QUERY, parentOrigin, true);

  await expect(async () =>
    expect(await received(page, "yassinos:ready")).toHaveLength(1)
  ).toPass({ timeout: 30_000 });
});

test("gives the parent escapes nothing in yassinOS used", async ({
  baseURL,
  page,
}) => {
  await loadRoom(page, baseURL);
  await helloUntilReady(page);

  await osFrame(page).locator(START_BUTTON_SELECTOR).click();
  await expect(osFrame(page).locator(START_MENU_SELECTOR)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(osFrame(page).locator(START_MENU_SELECTOR)).toBeHidden();

  expect(await received(page, "yassinos:escape")).toEqual([]);

  await page.mouse.click(800, 450);
  await page.keyboard.press("Escape");

  await expect(async () =>
    expect(await received(page, "yassinos:escape")).toHaveLength(1)
  ).toPass();

  const input = await received(page, "yassinos:input");

  expect(input.map(({ data }) => data.kind)).toEqual(
    expect.arrayContaining(["keydown", "pointerdown", "pointerup"])
  );
  // no key values, just the kind
  input.forEach(({ data }) =>
    expect(data).toEqual({ kind: expect.any(String), type: "yassinos:input" })
  );
});

test("opens apps the parent asks for, and reports them", async ({
  baseURL,
  page,
}) => {
  await loadRoom(page, baseURL);
  await helloUntilReady(page);

  await send(page, { app: "NotAnApp", type: "yassinos:open" });
  await send(page, { app: "Portfolio", type: "yassinos:open" });

  await expect(osFrame(page).locator(WINDOW_SELECTOR)).toHaveCount(1);
  await expect(osFrame(page).locator(WINDOW_SELECTOR)).toBeVisible();
  await expect(async () =>
    expect((await received(page, "yassinos:state")).at(-1)?.data).toEqual({
      apps: ["Portfolio"],
      focused: "Portfolio",
      type: "yassinos:state",
    })
  ).toPass();
});

test("pause stops the wallpaper and resume starts it again", async ({
  baseURL,
  browserName,
  page,
}) => {
  test.skip(
    browserName !== "chromium",
    "needs the animated wallpaper, WebGL in a worker"
  );

  await loadRoom(page, baseURL, ANIMATED_QUERY);
  await helloUntilReady(page);
  await expect(
    osFrame(page).locator(BACKGROUND_CANVAS_SELECTOR)
  ).toBeAttached();

  const isAnimating = async (): Promise<boolean> =>
    !(await wallpaperFrame(page)).equals(await wallpaperFrame(page));

  await expect(async () => expect(await isAnimating()).toBe(true)).toPass({
    timeout: 30_000,
  });

  await send(page, { type: "yassinos:pause" });
  await expect(async () => expect(await isAnimating()).toBe(false)).toPass();

  const paused = await wallpaperFrame(page);
  const later = [
    await wallpaperFrame(page),
    await wallpaperFrame(page),
    await wallpaperFrame(page),
  ];

  later.forEach((frame) => expect(frame.equals(paused)).toBe(true));

  await send(page, { type: "yassinos:resume" });
  await expect(async () => expect(await isAnimating()).toBe(true)).toPass();
});

test("ignores a parent that isn't allowed", async ({
  baseURL,
  browserName,
  page,
}) => {
  test.skip(browserName !== "chromium", "needs *.localhost to be loopback");

  await loadRoom(page, baseURL, ROOM_QUERY, notAllowedOrigin);
  await expect(osFrame(page).getByRole("timer")).toBeVisible();

  await send(page, HELLO);
  await send(page, { app: "Portfolio", type: "yassinos:open" });
  await send(page, HELLO);
  // nothing should come back, so give it time to
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(2000);

  expect(await received(page)).toEqual([]);
  await expect(osFrame(page).locator(WINDOW_SELECTOR)).toHaveCount(0);
});
