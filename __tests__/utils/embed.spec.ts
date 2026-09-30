import roomTheme from "public/embed/room-theme.json";
import defaultTheme from "styles/defaultTheme";
import {
  ROOM_WALLPAPER,
  SPAN_WALLPAPER,
  isEmbedded,
  isMainDisplay,
  isSpanWallpaper,
} from "utils/embed";
import { DEFAULT_WALLPAPER, TASKBAR_HEIGHT } from "utils/constants";

describe("room theme", () => {
  const { colors, formats, sizes } = defaultTheme;

  test("comes from yassinOS's theme", () => {
    expect(roomTheme.colors.background).toBe(colors.background);
    expect(roomTheme.colors.text).toBe(colors.text);
    expect(roomTheme.colors.accent).toBe(colors.highlight);
    expect(roomTheme.colors.accentDeep).toBe(colors.selectionHighlight);
    expect(roomTheme.fonts.ui).toBe(formats.systemFont);
    expect(roomTheme.taskbar.height).toBe(TASKBAR_HEIGHT);
    expect(roomTheme.taskbar.background).toBe(colors.taskbar.background);
    expect(roomTheme.window.titleBar.background).toBe(
      colors.titleBar.background
    );
    expect(roomTheme.window.titleBar.height).toBe(sizes.titleBar.height);
  });

  test("screens line up with the span image", () => {
    const { span, screens } = roomTheme;

    expect(span.px).toEqual({
      height: Math.round(span.mm.height * span.pxPerMm),
      width: Math.round(span.mm.width * span.pxPerMm),
    });

    Object.values(screens).forEach(({ mm, norm, px }) => {
      expect(norm.x).toBeCloseTo(mm.x / span.mm.width, 5);
      expect(norm.y).toBeCloseTo(mm.y / span.mm.height, 5);
      expect(norm.width).toBeCloseTo(mm.width / span.mm.width, 5);
      expect(norm.height).toBeCloseTo(mm.height / span.mm.height, 5);
      expect(px.width).toBeCloseTo(mm.width * span.pxPerMm, 1);
      expect(mm.x + mm.width).toBeLessThanOrEqual(span.mm.width + 1e-9);
      expect(mm.y + mm.height).toBeLessThanOrEqual(span.mm.height + 1e-9);
    });
  });
});

const load = (query: string): void =>
  window.history.replaceState({}, "", `/${query}`);

describe("embed params", () => {
  afterEach(() => load(""));

  test("standalone", () => {
    load("?display=main&wallpaper=span");
    expect(isEmbedded()).toBe(false);
    expect(isMainDisplay()).toBe(false);
    expect(isSpanWallpaper()).toBe(false);
  });

  test("the room's main screen", () => {
    load("?embed=1&display=main&protocol=1&wallpaper=span&quality=low");
    expect(isEmbedded()).toBe(true);
    expect(isMainDisplay()).toBe(true);
    expect(isSpanWallpaper()).toBe(true);
  });

  test("embedded without the room", () => {
    load("?embed=1&quality=high");
    expect(isEmbedded()).toBe(true);
    expect(isMainDisplay()).toBe(false);
    expect(isSpanWallpaper()).toBe(false);
  });
});

test("the main screen shows its part of the span image", () =>
  // M1 is the room's bottom left screen
  expect(SPAN_WALLPAPER).toEqual({
    position: "0% 100%",
    size: "163.6333% 210.1281%",
    url: "/embed/room-span.webp",
  }));

test("on its own, the default wallpaper is the whole span image", () => {
  expect(DEFAULT_WALLPAPER).toBe("ROOM");
  expect(ROOM_WALLPAPER).toEqual({
    position: "45% 50%",
    size: "cover",
    url: SPAN_WALLPAPER.url,
  });
});
