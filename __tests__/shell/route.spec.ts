import { clampBox, nudgeBox } from "shell/geometry";
import {
  nextShellBootScript,
  nextShellHref,
  rewrittenShellPath,
  shellFromSearch,
} from "shell/route";

const box = { height: 280, width: 360, x: 48, y: 48 };

describe("shell query routing", () => {
  test("only an exact shell=next query leaves classic", () => {
    expect(shellFromSearch("")).toBe("classic");
    expect(shellFromSearch("?embed=1")).toBe("classic");
    expect(shellFromSearch("?shell=classic")).toBe("classic");
    expect(shellFromSearch("?shell=NEXT")).toBe("classic");
    expect(shellFromSearch("?shell=nextish")).toBe("classic");
    expect(shellFromSearch("?shell=next")).toBe("next");
    expect(shellFromSearch("shell=next&embed=1")).toBe("next");
  });

  test("rewrites only the desktop root", () => {
    expect(rewrittenShellPath("/", "?shell=next&embed=1")).toBe("/next");
    expect(rewrittenShellPath("/", "?embed=1")).toBeUndefined();
    expect(rewrittenShellPath("/desktop", "?shell=next")).toBeUndefined();
    expect(rewrittenShellPath("/next", "")).toBeUndefined();
    expect(nextShellHref("/", "?shell=next&embed=1")).toBe(
      "/next?shell=next&embed=1"
    );
    expect(nextShellHref("/", "?embed=1")).toBeUndefined();
  });

  test("the boot script matches that route and keeps the query", () => {
    expect(nextShellBootScript).toBe(
      'if(location.pathname==="/"&&new URLSearchParams(location.search).get("shell")==="next"){location.replace("/next"+location.search)}'
    );
  });
});

describe("window geometry", () => {
  test("arrows move and shift-arrows resize without going under the minimum", () => {
    expect(nudgeBox(box, "ArrowRight", false).x).toBe(64);
    expect(nudgeBox(box, "ArrowUp", false).y).toBe(32);
    expect(nudgeBox(box, "ArrowRight", true).width).toBe(376);
    expect(nudgeBox({ ...box, width: 280 }, "ArrowLeft", true).width).toBe(280);
    expect(nudgeBox({ ...box, height: 180 }, "ArrowUp", true).height).toBe(180);
    expect(nudgeBox(box, "Enter", false)).toEqual(box);
  });

  test("keeps a sliver of the window on the display", () => {
    expect(
      clampBox({ ...box, x: -400, y: -20 }, { height: 400, width: 800 })
    ).toEqual({ ...box, x: -312, y: 0 });
    expect(
      clampBox({ ...box, x: 900, y: 500 }, { height: 400, width: 800 })
    ).toEqual({ ...box, x: 752, y: 352 });
  });
});
