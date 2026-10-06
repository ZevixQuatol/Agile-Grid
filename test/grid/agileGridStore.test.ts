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
  it("keeps the last legal preview when a drag would overlap another item", () => {
    const store = createAgileGridStore(layout);
    store.getState().toggleEditing();
    expect(store.getState().beginDrag("a", 0, { x: 0, y: 0 })).toBe(true);

    store.getState().previewDrag({ x: 1, y: 0, w: 1, h: 1 });

    expect(store.getState().drag).toMatchObject({
      preview: { x: 0, y: 0, w: 1, h: 1 },
      blocked: true,
    });
    store.getState().commitDrag();
    expect(store.getState().state.layout.pages[0].items[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("only removes the selected page item in editing mode", () => {
    const store = createAgileGridStore(layout);
    store.getState().removeItem("a");
    expect(store.getState().state.layout.pages[0].items).toHaveLength(2);

    store.getState().toggleEditing();
    store.getState().removeItem("a");
    expect(store.getState().state.layout.pages[0].items.map((item) => item.id)).toEqual(["b"]);
  });
});
