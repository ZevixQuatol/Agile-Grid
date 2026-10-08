import { describe, expect, it } from "vitest";
import { createAgileGridStore } from "../../src/stores/agileGridStore";
import type { GridLayout } from "../../src/core/grid/types";

const layout: GridLayout = {
  pages: [{
    items: [
      { id: "a", type: "small", x: 0, y: 0, w: 1, h: 1 },
      { id: "b", type: "small", x: 1, y: 0, w: 1, h: 1 },
    ],
  }],
};

describe("Agile Grid editing store", () => {
  it("allows overlap in the drag preview for collision resolution on commit", () => {
    const store = createAgileGridStore(layout);
    store.getState().toggleEditing();
    expect(store.getState().beginDrag("a", 0, { x: 0, y: 0 }, { columns: 4, rows: 2 })).toBe(true);

    store.getState().previewDrag({ x: 1, y: 0, w: 1, h: 1 });

    expect(store.getState().drag).toMatchObject({
      preview: { x: 1, y: 0, w: 1, h: 1 },
      blocked: false,
    });
    store.getState().commitDrag();
    expect(store.getState().state.layout.pages[0].items[0]).toMatchObject({ x: 1, y: 0 });
  });

  it("only removes the selected page item in editing mode", () => {
    const store = createAgileGridStore(layout);
    store.getState().removeItem("a", { columns: 4, rows: 2 });
    expect(store.getState().state.layout.pages[0].items).toHaveLength(2);

    store.getState().toggleEditing();
    store.getState().removeItem("a", { columns: 4, rows: 2 });
    expect(store.getState().state.layout.pages[0].items.map((item) => item.id)).toEqual(["b"]);
    expect(store.getState().state.layout.pages[0].items[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("adds items only in editing mode and selects the placed widget", () => {
    const store = createAgileGridStore(layout);
    const item = { id: "new", type: "small", x: 0, y: 0, w: 2, h: 1 };
    expect(store.getState().addItem(item, { columns: 4, rows: 2 })).toBe(false);

    store.getState().toggleEditing();
    expect(store.getState().addItem(item, { columns: 4, rows: 2 })).toBe(true);
    expect(store.getState().state.selectedItemId).toBe("new");
    expect(store.getState().state.layout.pages[0].items.find(({ id }) => id === "new")).toMatchObject({ x: 2, y: 0, w: 2, h: 1 });
  });

  it("adapts item sizes and preserves widget ids when capacity changes", () => {
    const store = createAgileGridStore({ pages: [{ items: [{ id: "large", type: "large", x: 0, y: 0, w: 4, h: 3 }] }] });

    store.getState().adaptLayout({ columns: 2, rows: 2 });

    expect(store.getState().state.layout.pages.flatMap((page) => page.items)).toEqual([
      { id: "large", type: "large", x: 0, y: 0, w: 2, h: 2 },
    ]);
  });

  it("keeps committed items when the viewport has no usable capacity", () => {
    const store = createAgileGridStore(layout);
    store.getState().adaptLayout({ columns: 0, rows: 0 });

    expect(store.getState().state.layout).toEqual(layout);
  });

  it("removes empty trailing pages after deletion", () => {
    const store = createAgileGridStore({ pages: [layout.pages[0], { items: [{ id: "last", type: "small", x: 0, y: 0, w: 1, h: 1 }] }] });
    store.getState().toggleEditing();
    store.getState().setActivePage(1);
    store.getState().removeItem("last", { columns: 4, rows: 2 });

    expect(store.getState().state.layout.pages).toHaveLength(1);
    expect(store.getState().state.activePage).toBe(0);
  });

  it("resizes a selected item and reflows the item it overlaps", () => {
    const store = createAgileGridStore(layout);
    store.getState().toggleEditing();
    expect(store.getState().beginResize("a", 0, "right", { x: 0, y: 0 }, { columns: 4, rows: 2 })).toBe(true);

    store.getState().previewResize({ x: 1, y: 0 });

    expect(store.getState().resize).toMatchObject({
      preview: { x: 0, y: 0, w: 2, h: 1 },
      blocked: false,
    });
    store.getState().commitResize();
    expect(store.getState().state.layout.pages[0].items).toEqual([
      { ...layout.pages[0].items[0], x: 0, y: 0, w: 2, h: 1 },
      { ...layout.pages[0].items[1], x: 2, y: 0 },
    ]);
  });
});

describe("arrangement permissions and commits", () => {
  const scattered: GridLayout = { pages: [
    { items: [{ id: "first", type: "small", x: 2, y: 2, w: 1, h: 1 }] },
    { items: [{ id: "second", type: "small", x: 3, y: 2, w: 1, h: 1 }] },
  ] };
  const bounds = { columns: 4, rows: 4 };

  it("compacts the active page and clears selection without moving other pages", () => {
    const store = createAgileGridStore(scattered);
    store.getState().toggleEditing();
    store.getState().setActivePage(1);
    store.getState().selectItem("second");
    store.getState().arrangeItems("page", bounds);

    expect(store.getState().state.layout.pages[0]).toEqual(scattered.pages[0]);
    expect(store.getState().state.layout.pages[1].items[0]).toMatchObject({ id: "second", x: 3, y: 0, w: 1, h: 1 });
    expect(store.getState().state.activePage).toBe(1);
    expect(store.getState().state.selectedItemId).toBeUndefined();
  });

  it("arranges all pages, trims empty pages and clamps the active page", () => {
    const store = createAgileGridStore(scattered);
    store.getState().toggleEditing();
    store.getState().setActivePage(1);
    store.getState().arrangeItems("all", bounds);

    expect(store.getState().state.layout.pages).toEqual([{ items: [
      { ...scattered.pages[0].items[0], x: 0, y: 0 },
      { ...scattered.pages[1].items[0], x: 1, y: 0 },
    ] }]);
    expect(store.getState().state.activePage).toBe(0);
  });

  it.each(["page", "all"] as const)("blocks %s arrangement in browse mode, zero capacity and active pointer transactions", (scope) => {
    const store = createAgileGridStore(scattered);
    store.getState().arrangeItems(scope, bounds);
    expect(store.getState().state.layout).toEqual(scattered);
    store.getState().toggleEditing();
    store.getState().arrangeItems(scope, { columns: 4, rows: 0 });
    expect(store.getState().state.layout).toEqual(scattered);

    store.getState().beginDrag("first", 0, { x: 0, y: 0 }, bounds);
    const drag = store.getState().drag;
    store.getState().arrangeItems(scope, bounds);
    expect(store.getState().state.layout).toEqual(scattered);
    expect(store.getState().drag).toBe(drag);
    store.getState().cancelDrag();

    store.getState().beginResize("first", 0, "corner", { x: 0, y: 0 }, bounds);
    const resize = store.getState().resize;
    store.getState().arrangeItems(scope, bounds);
    expect(store.getState().state.layout).toEqual(scattered);
    expect(store.getState().resize).toBe(resize);
  });
});
