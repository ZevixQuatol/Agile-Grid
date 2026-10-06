import { describe, expect, it } from "vitest";
import {
  fitsGrid,
  getGridMetrics,
  gridToPixel,
  dragToGrid,
  rectsOverlap,
  pixelToGrid,
} from "../../src/core/grid/coordinates";
import type { GridConfig, GridRect } from "../../src/core/grid/types";

const config: GridConfig = { columns: 12, rowHeight: 80, gapX: 8, gapY: 8 };
const metrics = getGridMetrics(1048, 520, config);

describe("finite page metrics", () => {
  it("counts only complete rows, including gaps between cells", () => {
    expect(metrics).toEqual({
      width: 1048, height: 520, columns: 12, rows: 6,
      cellWidth: 80, cellHeight: 80, gapX: 8, gapY: 8,
    });
    expect(getGridMetrics(1048, 519, config).rows).toBe(5);
    expect(getGridMetrics(1048, 79, config).rows).toBe(0);
    expect(getGridMetrics(1048, 80, config).rows).toBe(1);
  });

  it("supports independent gaps and fractional widths", () => {
    const result = getGridMetrics(1000, 253, { ...config, gapY: 6 });
    expect(result.cellWidth).toBeCloseTo(76);
    expect(result.rows).toBe(3);
    const last = gridToPixel({ x: 11, y: 2, w: 1, h: 1 }, result);
    expect(last.left + last.width).toBeCloseTo(1000);
    expect(last.top + last.height).toBeLessThanOrEqual(253);
  });

  it("allows zero space without producing negative cell widths", () => {
    expect(getGridMetrics(0, 0, config)).toMatchObject({ rows: 0, cellWidth: 0 });
    expect(getGridMetrics(50, 520, config).cellWidth).toBe(0);
  });

  it.each([
    { columns: 0 }, { columns: 1.5 }, { rowHeight: 0 },
    { rowHeight: Infinity }, { gapX: -1 }, { gapY: NaN },
  ])("rejects invalid configuration %j", (change) => {
    expect(() => getGridMetrics(1048, 520, { ...config, ...change })).toThrow(RangeError);
  });

  it.each([[-1, 80], [80, -1], [NaN, 80], [80, Infinity]])(
    "rejects non-finite or negative viewport %s × %s", (width, height) => {
      expect(() => getGridMetrics(width, height, config)).toThrow(RangeError);
    },
  );
});

describe("grid to pixel", () => {
  it.each([
    [{ x: 0, y: 0, w: 1, h: 1 }, { left: 0, top: 0, width: 80, height: 80 }],
    [{ x: 1, y: 0, w: 2, h: 1 }, { left: 88, top: 0, width: 168, height: 80 }],
    [{ x: 2, y: 1, w: 3, h: 2 }, { left: 176, top: 88, width: 256, height: 168 }],
    [{ x: 0, y: 2, w: 4, h: 4 }, { left: 0, top: 176, width: 344, height: 344 }],
  ])("renders %j with internal gaps", (rect, expected) => {
    expect(gridToPixel(rect, metrics)).toEqual(expected);
  });

  it("fills the page exactly without an outer trailing gap", () => {
    expect(gridToPixel({ x: 0, y: 0, w: 12, h: 6 }, metrics)).toEqual({
      left: 0, top: 0, width: 1048, height: 520,
    });
    expect(gridToPixel({ x: 11, y: 5, w: 1, h: 1 }, metrics)).toEqual({
      left: 968, top: 440, width: 80, height: 80,
    });
  });

  it("preserves fractional alignment and round-trips legal cell origins", () => {
    for (const width of [1000.25, 1280, 1536.5]) {
      for (const columns of [8, 12, 16]) {
        const page = getGridMetrics(width, 613.5, { ...config, columns });
        for (let y = 0; y < page.rows; y++) {
          for (let x = 0; x < columns; x++) {
            const rect = { x, y, w: columns - x, h: page.rows - y };
            const pixel = gridToPixel(rect, page);
            expect(pixelToGrid(pixel.left, pixel.top, page)).toEqual({ x, y });
            expect(pixel.left + pixel.width).toBeCloseTo(width, 9);
            expect(pixel.top + pixel.height).toBeLessThanOrEqual(page.height);
          }
        }
      }
    }
  });

  it("does not mutate layout input", () => {
    const rect = Object.freeze({ x: 2, y: 1, w: 3, h: 2 });
    gridToPixel(rect, metrics);
    expect(rect).toEqual({ x: 2, y: 1, w: 3, h: 2 });
  });

  it("cannot render without usable cell capacity", () => {
    expect(() => gridToPixel({ x: 0, y: 0, w: 1, h: 1 }, getGridMetrics(50, 520, config))).toThrow(RangeError);
    expect(() => gridToPixel({ x: 0, y: 0, w: 1, h: 1 }, getGridMetrics(1048, 0, config))).toThrow(RangeError);
  });
});

describe("page bounds", () => {
  it("accepts rectangles touching the right and bottom edges", () => {
    expect(fitsGrid({ x: 11, y: 5, w: 1, h: 1 }, metrics)).toBe(true);
    expect(fitsGrid({ x: 0, y: 0, w: 12, h: 6 }, metrics)).toBe(true);
  });

  const invalid: GridRect[] = [
    { x: -1, y: 0, w: 1, h: 1 },
    { x: 0, y: -1, w: 1, h: 1 },
    { x: 0.5, y: 0, w: 1, h: 1 },
    { x: 0, y: 0, w: 0, h: 1 },
    { x: 0, y: 0, w: 1, h: 0 },
    { x: 0, y: 0, w: 1.5, h: 1 },
    { x: 11, y: 0, w: 2, h: 1 },
    { x: 0, y: 5, w: 1, h: 2 },
    { x: NaN, y: 0, w: 1, h: 1 },
    { x: 0, y: 0, w: Infinity, h: 1 },
  ];

  it.each(invalid)("rejects invalid or overflowing rectangle %j", (rect) => {
    expect(fitsGrid(rect, metrics)).toBe(false);
    expect(() => gridToPixel(rect, metrics)).toThrow(RangeError);
  });

  it("rejects a zero-row page", () => {
    expect(fitsGrid({ x: 0, y: 0, w: 1, h: 1 }, { columns: 12, rows: 0 })).toBe(false);
  });
});

describe("pixel to grid", () => {
  it("snaps to the nearest origin on each axis", () => {
    expect(pixelToGrid(43, 43, metrics)).toEqual({ x: 0, y: 0 });
    expect(pixelToGrid(45, 45, metrics)).toEqual({ x: 1, y: 1 });
    expect(pixelToGrid(176, 88, metrics)).toEqual({ x: 2, y: 1 });
  });

  it("leaves boundary constraints separate from coordinate conversion", () => {
    expect(pixelToGrid(-88, 616, metrics)).toEqual({ x: -1, y: 7 });
  });

  it("rejects non-finite points and unavailable metrics", () => {
    expect(() => pixelToGrid(NaN, 0, metrics)).toThrow(RangeError);
    expect(() => pixelToGrid(0, Infinity, metrics)).toThrow(RangeError);
    expect(() => pixelToGrid(0, 0, getGridMetrics(1048, 0, config))).toThrow(RangeError);
  });
});

describe("drag coordinates", () => {
  it("keeps the pointer offset and clamps the whole widget to the page", () => {
    expect(dragToGrid({ x: 2, y: 1, w: 3, h: 2 }, { x: 12, y: 6 }, { x: 400, y: 200 }, metrics)).toEqual({ x: 4, y: 2 });
    expect(dragToGrid({ x: 2, y: 1, w: 3, h: 2 }, { x: 12, y: 6 }, { x: -100, y: -50 }, metrics)).toEqual({ x: 0, y: 0 });
    expect(dragToGrid({ x: 2, y: 1, w: 3, h: 2 }, { x: 12, y: 6 }, { x: 2000, y: 2000 }, metrics)).toEqual({ x: 9, y: 4 });
  });

  it("detects only area intersections", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 })).toBe(true);
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 1, h: 1 })).toBe(false);
  });
});
