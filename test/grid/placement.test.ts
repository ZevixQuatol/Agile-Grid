import { describe, expect, it } from "vitest";
import { addGridItem, adaptLayoutToBounds, compactLayout, reflowDraggedItem } from "../../src/core/grid/placement";
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
