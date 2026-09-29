import roomTheme from "public/embed/room-theme.json";
import { getSearchParam } from "utils/functions";

// how the page is embedded, read from its query string. yassin.app's room
// loads /?embed=1&display=main&protocol=1&wallpaper=span&quality=high|low

export const isEmbedded = (): boolean =>
  typeof window !== "undefined" && getSearchParam("embed") === "1";

// the room's main screen (M1), the only one of its screens yassinOS draws
export const isMainDisplay = (): boolean =>
  isEmbedded() && getSearchParam("display") === "main";

// one still image spans the room's three screens, instead of the animated
// wallpaper
export const isSpanWallpaper = (): boolean =>
  isEmbedded() && getSearchParam("wallpaper") === "span";

const {
  screens: { M1 },
  span,
} = roomTheme;
const percent = (fraction: number): string =>
  `${Number((fraction * 100).toFixed(4))}%`;

// the part of the span image behind the main screen, as css background
// position and size
export const SPAN_WALLPAPER = {
  position: `${percent(M1.mm.x / (span.mm.width - M1.mm.width))} ${percent(
    M1.mm.y / (span.mm.height - M1.mm.height)
  )}`,
  size: `${percent(span.mm.width / M1.mm.width)} ${percent(
    span.mm.height / M1.mm.height
  )}`,
  url: span.path,
};

let spanWallpaperLoad: Promise<void> | undefined;

// resolves once the image is decoded (or failed), so it paints in one go
export const loadSpanWallpaper = (): Promise<void> => {
  spanWallpaperLoad ??= new Promise((resolve) => {
    const image = new Image();

    image.decoding = "async";
    image.src = SPAN_WALLPAPER.url;
    image.decode().then(resolve, () => resolve());
  });

  return spanWallpaperLoad;
};
