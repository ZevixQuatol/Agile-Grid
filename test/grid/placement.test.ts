import { describe, expect, it } from "vitest";
import { reflowDraggedItem } from "../../src/core/grid/placement";
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
