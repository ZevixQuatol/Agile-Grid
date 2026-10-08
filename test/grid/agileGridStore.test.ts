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
