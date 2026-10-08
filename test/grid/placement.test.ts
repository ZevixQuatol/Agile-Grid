import { describe, expect, it } from "vitest";
import { addGridItem, adaptLayoutToBounds, compactLayout, compactPage, reflowDraggedItem } from "../../src/core/grid/placement";
import { fitsGrid, rectsOverlap } from "../../src/core/grid/coordinates";
import type { GridPage } from "../../src/core/grid/types";

const pages: GridPage[] = [{ items: [
  { id: "moving", type: "small", x: 0, y: 0, w: 2, h: 1 },
  { id: "occupied", type: "medium", x: 2, y: 0, w: 2, h: 1 },
  { id: "tail", type: "small", x: 4, y: 0, w: 2, h: 1 },
] }];

describe("drag placement", () => {
  it("pushes overlapping items forward in deterministic row-major order", () => {
    const result = reflowDraggedItem(pages, 0, "moving", { x: 2, y: 0, w: 2, h: 1 }, { columns: 6, rows: 2 });
    expect(result.placed).toEqual({ x: 2, y: 0, w: 2, h: 1 });
    expect(result.pages[0].items.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: "tail", x: 4, y: 0 },
      { id: "moving", x: 2, y: 0 },
      { id: "occupied", x: 0, y: 1 },
    ]);
  });

  it("moves displaced items to a new page when the current page is full", () => {
    const result = reflowDraggedItem(pages, 0, "moving", { x: 2, y: 0, w: 2, h: 1 }, { columns: 6, rows: 1 });
    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].items.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: "tail", x: 4, y: 0 },
      { id: "moving", x: 2, y: 0 },
    ]);
    expect(result.pages[1].items).toEqual([{ ...pages[0].items[1], x: 0, y: 0 }]);
  });

  it("rolls back when the requested widget cannot fit on one page", () => {
    const result = reflowDraggedItem(pages, 0, "moving", { x: 0, y: 0, w: 7, h: 1 }, { columns: 6, rows: 1 });
    expect(result.success).toBe(false);
    expect(result.pages).toEqual(pages);
    expect(result.placed).toMatchObject({ x: 0, y: 0, w: 2, h: 1 });
  });

  it("rolls back when the requested position exceeds page bounds", () => {
    const result = reflowDraggedItem(pages, 0, "moving", { x: 5, y: 0, w: 2, h: 1 }, { columns: 6, rows: 1 });
    expect(result.success).toBe(false);
    expect(result.pages).toEqual(pages);
  });
});

describe("layout placement and adaptation", () => {
  it("adds a widget to a new page when every current page is full", () => {
    const result = addGridItem([{ items: [{ id: "existing", type: "small", x: 0, y: 0, w: 2, h: 1 }] }], { id: "new", type: "small", x: 0, y: 0, w: 1, h: 1 }, { columns: 2, rows: 1 });

    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[1].items[0]).toMatchObject({ id: "new", x: 0, y: 0, w: 1, h: 1 });
  });

  it("shrinks an oversized widget to the effective page capacity", () => {
    const result = addGridItem([], { id: "large", type: "large", x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 2 }, { columns: 2, rows: 1 });

    expect(result.success).toBe(true);
    expect(result.placed).toMatchObject({ w: 2, h: 1 });
    expect(result.pages).toHaveLength(1);
  });

  it("reflows overflow after capacity shrinks without losing ids", () => {
    const result = adaptLayoutToBounds([{ items: [
      { id: "large", type: "large", x: 0, y: 0, w: 4, h: 2 },
      { id: "small", type: "small", x: 4, y: 0, w: 1, h: 1 },
    ] }], { columns: 2, rows: 2 });

    expect(result.success).toBe(true);
    expect(result.pages.flatMap((page) => page.items.map((item) => item.id))).toEqual(["large", "small"]);
    expect(result.pages[0].items[0]).toMatchObject({ w: 2, h: 2 });
    expect(result.pages[1].items[0]).toMatchObject({ id: "small", x: 0, y: 0 });
  });

  it("fills a deletion gap and removes trailing empty pages", () => {
    const result = compactLayout([
      { items: [{ id: "first", type: "small", x: 0, y: 0, w: 1, h: 1 }] },
      { items: [{ id: "next", type: "small", x: 0, y: 0, w: 1, h: 1 }] },
    ], { columns: 3, rows: 1 });

    expect(result.success).toBe(true);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].items.map((item) => [item.id, item.x])).toEqual([["first", 0], ["next", 1]]);
  });
});

describe("arrangement presets", () => {
  it("moves current-page widgets upward without changing columns, sizes or other pages", () => {
    const input: GridPage[] = [
      { items: [
        { id: "bottom", type: "small", x: 0, y: 3, w: 2, h: 1 },
        { id: "top", type: "medium", x: 0, y: 1, w: 2, h: 2 },
        { id: "separate", type: "small", x: 2, y: 3, w: 2, h: 1 },
      ] },
      { items: [{ id: "other-page", type: "small", x: 0, y: 3, w: 1, h: 1 }] },
    ];
    const original = structuredClone(input);
    const bounds = { columns: 4, rows: 4 };
    const result = compactPage(input, 0, bounds);

    expect(result.success).toBe(true);
    expect(result.pages[0].items).toEqual([
      { ...input[0].items[0], y: 2 },
      { ...input[0].items[1], y: 0 },
      { ...input[0].items[2], y: 0 },
    ]);
    expect(result.pages[1]).toBe(input[1]);
    expect(input).toEqual(original);
    expect(compactPage(result.pages, 0, bounds)).toEqual(result);
  });

  it("arranges mixed rectangles across pages in visual order with no overlap or lost ids", () => {
    const input: GridPage[] = [
      { items: [
        { id: "tall", type: "medium", x: 0, y: 2, w: 1, h: 2 },
        { id: "wide", type: "wide", x: 0, y: 1, w: 3, h: 1 },
        { id: "first", type: "app", x: 2, y: 0, w: 1, h: 1 },
      ] },
      { items: [{ id: "next-page", type: "medium", x: 2, y: 1, w: 2, h: 2 }] },
      { items: [] },
    ];
    const original = structuredClone(input);
    const bounds = { columns: 4, rows: 4 };
    const result = compactLayout(input, bounds);

    expect(result.success).toBe(true);
    expect(result.pages).toEqual([{ items: [
      { ...input[0].items[2], x: 0, y: 0 },
      { ...input[0].items[1], x: 1, y: 0 },
      { ...input[0].items[0], x: 0, y: 1 },
      { ...input[1].items[0], x: 1, y: 1 },
    ] }]);
    expect(input).toEqual(original);
    const shuffled = input.map((page) => ({ items: [...page.items].reverse() }));
    expect(compactLayout(shuffled, bounds)).toEqual(result);
    const paginated = compactLayout(input, { columns: 3, rows: 2 });
    expect(paginated.pages.length).toBeGreaterThan(1);
    expect(paginated.pages.flatMap((page) => page.items.map(({ id }) => id)).sort()).toEqual(["first", "next-page", "tall", "wide"]);
    for (const page of paginated.pages) {
      expect(page.items.every((item) => fitsGrid(item, { columns: 3, rows: 2 }))).toBe(true);
      expect(page.items.some((item, index) => page.items.slice(index + 1).some((other) => rectsOverlap(item, other)))).toBe(false);
    }
  });

  it("preserves the input on zero capacity or failed page compaction and keeps an empty layout usable", () => {
    expect(compactLayout(pages, { columns: 6, rows: 0 })).toEqual({ pages, success: false });
    expect(compactPage(pages, 0, { columns: 6, rows: 0 })).toEqual({ pages, success: false });
    expect(compactPage(pages, 8, { columns: 6, rows: 2 })).toEqual({ pages, success: false });
    expect(compactPage(pages, 0, { columns: 1, rows: 2 })).toEqual({ pages, success: false });
    expect(compactLayout([{ items: [] }, { items: [] }], { columns: 6, rows: 2 })).toEqual({ pages: [{ items: [] }], success: true });
  });
});
