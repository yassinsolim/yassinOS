// captures public/embed/poster-main.webp: the room's main screen (M1) with
// nothing open, which yassin.app shows until the embedded desktop is ready
//
// node scripts/embedPoster.js [url]           default http://localhost:3000
// node scripts/embedPoster.js [url] --clock   keep the clock (it would show
//                                             the capture time, so it's
//                                             hidden by default)
//
// run it against `yarn dev` or a production build (`yarn build && yarn serve`),
// with playwright's chromium installed (`yarn playwright install chromium`)

const { writeFileSync } = require("fs");
const { join, resolve } = require("path");
const { chromium } = require("playwright-core");

const OUT_FILE = join(
  resolve(__dirname, ".."),
  "public/embed/poster-main.webp"
);
const MAX_BYTES = 150 * 1024;
const QUALITY = 0.9;
const SIZE = { height: 900, width: 1600 };
const QUERY = "embed=1&display=main&wallpaper=span";

// same idea as the bridge's ready: taskbar with its clock, every desktop icon
// drawn, and the span wallpaper decoded
const isDrawn = () => {
  const icons = [...document.querySelectorAll("main > ol > li img")];
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue("--after-background")
    .includes("room-span");

  return Boolean(
    background &&
      document.querySelector("main > nav:not([style]) [role=timer]") &&
      icons.length > 0 &&
      icons.every(({ complete, naturalWidth }) => complete && naturalWidth > 0)
  );
};

const toWebp = async (page, png, quality) =>
  page.evaluate(
    async ({ data, type, value }) => {
      const image = new Image();

      image.src = `data:image/png;base64,${data}`;
      await image.decode();

      const canvas = document.createElement("canvas");

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);

      return canvas.toDataURL(type, value).split(",")[1];
    },
    { data: png.toString("base64"), type: "image/webp", value: quality }
  );

const main = async () => {
  const args = process.argv.slice(2);
  const baseUrl = (
    args.find((arg) => !arg.startsWith("--")) || "http://localhost:3000"
  ).replace(/\/$/, "");
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: SIZE,
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/?${QUERY}`);
    await page.waitForFunction(isDrawn, undefined, {
      polling: 250,
      timeout: 120_000,
    });
    await page.evaluate(() => document.fonts.ready);

    if (!args.includes("--clock")) {
      await page.addStyleTag({
        content: "main > nav [role=timer] { visibility: hidden; }",
      });
    }

    // let the icons finish fading in
    await page.waitForTimeout(1000);

    const png = await page.screenshot({ type: "png" });
    const bytes = Buffer.from(await toWebp(page, png, QUALITY), "base64");

    writeFileSync(OUT_FILE, bytes);
    console.info(
      `wrote public/embed/poster-main.webp (${SIZE.width} x ${SIZE.height}, ${Math.round(bytes.length / 1024)} KB)`
    );

    if (bytes.length > MAX_BYTES) {
      throw new Error(`poster-main.webp is over ${MAX_BYTES / 1024} KB`);
    }
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
