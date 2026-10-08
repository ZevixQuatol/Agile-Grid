import { describe, expect, it, vi } from "vitest";
import { restoreLayout, serializeLayout, type PersistedGrid } from "../../src/core/grid/serializer";
import { createAgileGridStore } from "../../src/stores/agileGridStore";
import { connectGridPersistence } from "../../src/stores/gridPersistence";

const layout = { pages: [{ items: [{ id: "a", type: "small", x: 0, y: 0, w: 1, h: 1 }, { id: "b", type: "small", x: 1, y: 0, w: 1, h: 1 }] }] };
const valid = () => serializeLayout(createAgileGridStore(layout).getState().state);
function storage(initial: string | null = null) { let value = initial; return { getItem: vi.fn(() => value), setItem: vi.fn((_key: string, next: string) => { value = next; }) }; }

describe("persistence serializer", () => {
  it("round trips committed fields and excludes runtime state", () => {
    const store = createAgileGridStore(layout); const state = store.getState().state;
    state.activePage = 3; state.editing = true; state.selectedItemId = "a"; Object.assign(state.layout.pages[0].items[0], { minW: 2, draggable: false, left: 20 });
    const json = serializeLayout(state); const restored = restoreLayout(json)!;
    expect(Object.keys(restored)).toEqual(["version", "grid", "dock", "pages"]); expect(restored.pages[0].items[0]).toMatchObject({ id: "a", minW: 2, draggable: false });
    for (const field of ["activePage", "editing", "selectedItemId", "left"]) expect(json).not.toContain(field);
    state.layout.pages[0].items.reverse();
    expect(serializeLayout(state)).toBe(json);
  });
  const invalid: [string, (data: PersistedGrid) => void][] = [
    ["version", (d) => Object.assign(d, { version: 2 })],
    ["columns", (d) => { d.grid.columns = 0; }],
    ["height", (d) => { d.grid.rowHeight = 0; }],
    ["gap", (d) => { d.grid.gapX = -1; }],
    ["direction", (d) => Object.assign(d.dock, { position: "bad" })],
    ["thickness", (d) => { d.dock.size = 161; }],
    ["visibility", (d) => Object.assign(d.dock, { visible: "true" })],
    ["pages", (d) => { d.pages = []; }],
    ["id", (d) => { d.pages[0].items[0].id = d.pages[0].items[1].id; }],
    ["cross-page id", (d) => { d.pages.push({ items: [{ ...d.pages[0].items[0] }] }); }],
    ["empty type", (d) => { d.pages[0].items[0].type = " "; }],
    ["null page items", (d) => Object.assign(d.pages[0], { items: null })],
    ["position", (d) => { d.pages[0].items[0].x = -1; }],
    ["span", (d) => { d.pages[0].items[0].w = 0; }],
    ["fraction", (d) => { d.pages[0].items[0].w = 1.5; }],
    ["min/max", (d) => { d.pages[0].items[0].minW = 3; d.pages[0].items[0].maxW = 2; }],
    ["flags", (d) => Object.assign(d.pages[0].items[0], { draggable: 1 })],
    ["sizes", (d) => { d.pages[0].items[0].allowedSizes = [{ w: 0, h: 1 }]; }],
    ["overlap", (d) => { d.pages[0].items[1].x = 0; }],
  ];
  it.each(invalid)("rejects invalid %s", (_name, mutate) => {
    const data: PersistedGrid = JSON.parse(valid());
    mutate(data);
    expect(restoreLayout(JSON.stringify(data))).toBeNull();
  });
  it.each(["{", "null", "[]", "{}"])("rejects malformed JSON: %s", (raw) => expect(restoreLayout(raw)).toBeNull());
  it("accepts one empty page and strips unknown keys from restored records", () => {
    const data: PersistedGrid = JSON.parse(valid());
    Object.assign(data.grid, { widthPx: 123 });
    Object.assign(data.dock, { mystery: 1 });
    data.pages = [{ items: [] }];
    const restored = restoreLayout(JSON.stringify(data))!;
    expect(restored.pages).toEqual([{ items: [] }]);
    expect(Object.keys(restored.grid)).toEqual(["columns", "rowHeight", "gapX", "gapY"]);
    expect(Object.keys(restored.dock)).toEqual(["position", "size", "visible"]);
  });
});

describe("committed state persistence", () => {
  it("skips preview, cancellation, selection, page/overlay changes and unchanged commits", () => {
    const store = createAgileGridStore(layout);
    const source = storage(valid());
    const disconnect = connectGridPersistence(store, source, vi.fn());
    const bounds = { columns: 4, rows: 2 };
    store.getState().toggleEditing();
    store.getState().selectItem("a");
    store.getState().toggleOverlay();
    store.getState().setActivePage(0);
    store.getState().beginDrag("a", 0, { x: 0, y: 0 }, bounds);
    store.getState().previewDrag({ x: 1, y: 0, w: 1, h: 1 });
    expect(source.setItem).not.toHaveBeenCalled();
    store.getState().cancelDrag();
    store.getState().beginResize("a", 0, "right", { x: 0, y: 0 }, bounds);
    store.getState().previewResize({ x: 2, y: 0 });
    store.getState().cancelResize();
    store.getState().beginDrag("a", 0, { x: 0, y: 0 }, bounds);
    store.getState().commitDrag();
    store.getState().beginResize("a", 0, "corner", { x: 0, y: 0 }, bounds);
    store.getState().previewResize({ x: 0, y: 0 });
    store.getState().commitResize();
    expect(source.setItem).not.toHaveBeenCalled();
    store.getState().beginDrag("a", 0, { x: 0, y: 0 }, bounds);
    store.getState().previewDrag({ x: 1, y: 0, w: 1, h: 1 });
    store.getState().commitDrag();
    expect(source.setItem).toHaveBeenCalledTimes(1);
    expect(restoreLayout(source.getItem()!)?.pages[0].items.find((item) => item.id === "a")?.x).toBe(1);
    disconnect();
    store.getState().setDockPosition("right");
    expect(source.setItem).toHaveBeenCalledTimes(1);
  });
  it("persists resize/add/remove/arrange and capacity adaptation while preserving ids", () => {
    const store = createAgileGridStore(layout);
    const source = storage(valid());
    const disconnect = connectGridPersistence(store, source, vi.fn());
    const bounds = { columns: 4, rows: 2 };
    store.getState().toggleEditing();
    store.getState().beginResize("a", 0, "right", { x: 0, y: 0 }, bounds);
    store.getState().previewResize({ x: 1, y: 0 });
    store.getState().commitResize();
    expect(restoreLayout(source.getItem()!)?.pages[0].items.find((item) => item.id === "a")?.w).toBe(2);
    store.getState().addItem({ id: "d", type: "small", x: 0, y: 0, w: 1, h: 1 }, bounds);
    expect(restoreLayout(source.getItem()!)?.pages.flatMap((page) => page.items).map((item) => item.id)).toContain("d");
    store.getState().removeItem("d", bounds);
    store.getState().arrangeItems("all", bounds);
    store.getState().toggleEditing();
    store.getState().adaptLayout({ columns: 1, rows: 1 });
    const restored = restoreLayout(source.getItem()!)!;
    expect(restored.pages.flatMap((page) => page.items).map((item) => item.id).sort()).toEqual(["a", "b"]);
    expect(restored.pages.flatMap((page) => page.items).every((item) => item.w === 1 && item.h === 1)).toBe(true);
    disconnect();
  });
  it("keeps oversized saved items at zero capacity and persists fitting sizes after recovery", () => {
    const large = createAgileGridStore({ pages: [{ items: [{ id: "big", type: "large", x: 100, y: 100, w: 20, h: 30, minW: 8, allowedSizes: [{ w: 8, h: 8 }] }] }] });
    const source = storage(serializeLayout(large.getState().state));
    const store = createAgileGridStore();
    const disconnect = connectGridPersistence(store, source, vi.fn());
    store.getState().adaptLayout({ columns: 0, rows: 0 });
    expect(source.setItem).not.toHaveBeenCalled();
    expect(store.getState().state.layout.pages[0].items[0].h).toBe(30);
    store.getState().adaptLayout({ columns: 2, rows: 1 });
    expect(restoreLayout(source.getItem()!)?.pages[0].items[0]).toMatchObject({ id: "big", w: 2, h: 1, minW: 8, allowedSizes: [{ w: 8, h: 8 }] });
    disconnect();
  });
  it("does not overwrite unknown versions at startup and keeps memory edits on quota failure", () => {
    const broken = storage('{"version":2}');
    const store = createAgileGridStore(layout);
    const message = vi.fn();
    const disconnect = connectGridPersistence(store, broken, message);
    store.getState().adaptLayout({ columns: 1, rows: 1 });
    expect(broken.getItem()).toBe('{"version":2}');
    store.getState().toggleEditing();
    store.getState().setDockSize(80);
    expect(restoreLayout(broken.getItem()!)?.dock.size).toBe(80);
    disconnect();
    const full = { getItem: () => serializeLayout(store.getState().state), setItem: vi.fn(() => { throw new Error("quota"); }) };
    const stop = connectGridPersistence(store, full, message);
    store.getState().setDockPosition("right");
    expect(store.getState().state.dock.position).toBe("right");
    expect(message).toHaveBeenCalledWith(expect.stringContaining("保存失败"));
    stop();
  });
  it("restores runtime defaults and saves config/dock changes", () => {
    const data = JSON.parse(valid()); data.grid.columns = 4; data.dock.position = "right"; data.dock.size = 80;
    const source = storage(JSON.stringify(data)); const store = createAgileGridStore(); const disconnect = connectGridPersistence(store, source, vi.fn());
    expect(store.getState().state).toMatchObject({ config: data.grid, dock: data.dock, activePage: 0, editing: false });
    store.getState().toggleEditing(); store.getState().setDockSize(100); expect(source.setItem).toHaveBeenCalledTimes(1); disconnect();
  });
  it("initializes missing storage and reports invalid/read failures", () => {
    const message = vi.fn(); const source = storage(); const store = createAgileGridStore(layout); const disconnect = connectGridPersistence(store, source, message);
    expect(source.setItem).toHaveBeenCalledTimes(1); expect(message).toHaveBeenCalledWith(expect.stringContaining("暂无")); disconnect();
    const broken = storage('{"version":2}'); const brokenStore = createAgileGridStore(layout); connectGridPersistence(brokenStore, broken, message)(); expect(broken.setItem).not.toHaveBeenCalled(); expect(message).toHaveBeenCalledWith(expect.stringContaining("版本"));
    const unreadable = { getItem: vi.fn(() => { throw new Error("denied"); }), setItem: vi.fn() }; connectGridPersistence(createAgileGridStore(layout), unreadable, message); expect(message).toHaveBeenCalledWith(expect.stringContaining("无法读取"));
  });
});
