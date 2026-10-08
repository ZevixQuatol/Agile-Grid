import { describe, expect, it } from "vitest";
import { resizeRect } from "../../src/core/grid/resize";
import type { AgileGridItem } from "../../src/core/grid/types";

const item: AgileGridItem = { id: "item", type: "medium", x: 2, y: 1, w: 2, h: 2 };
const bounds = { columns: 8, rows: 6 };

describe("resizeRect", () => {
  it("resizes only the requested axis and keeps the top-left anchor", () => {
    expect(resizeRect(item, "right", { x: 2, y: 3 }, bounds)).toEqual({ x: 2, y: 1, w: 4, h: 2 });
    expect(resizeRect(item, "bottom", { x: 2, y: 3 }, bounds)).toEqual({ x: 2, y: 1, w: 2, h: 5 });
    expect(resizeRect(item, "corner", { x: 2, y: 3 }, bounds)).toEqual({ x: 2, y: 1, w: 4, h: 5 });
  });

  it("clamps the requested size to page edges and declared min/max", () => {
    expect(resizeRect({ ...item, maxW: 3, maxH: 3 }, "corner", { x: 20, y: 20 }, bounds)).toEqual({ x: 2, y: 1, w: 3, h: 3 });
    expect(resizeRect({ ...item, minW: 3, minH: 3 }, "corner", { x: -20, y: -20 }, bounds)).toEqual({ x: 2, y: 1, w: 3, h: 3 });
    expect(resizeRect({ ...item, x: 6, y: 4 }, "corner", { x: 20, y: 20 }, bounds)).toEqual({ x: 6, y: 4, w: 2, h: 2 });
  });

  it("uses integer Cell deltas", () => {
    expect(resizeRect(item, "corner", { x: 1.6, y: 1.4 }, bounds)).toEqual({ x: 2, y: 1, w: 4, h: 3 });
  });
});
