import { createStore } from "zustand/vanilla";
import demoLayout from "@/data/demo-layout.json";
import { addGridItem, adaptLayoutToBounds, compactLayout, compactPage, reflowDraggedItem } from "@/core/grid/placement";
import { resizeRect } from "@/core/grid/resize";
import { fitsGrid } from "@/core/grid/coordinates";
import { dockSizeRange } from "@/core/grid/types";
import type { AgileGridItem, AgileGridState, DockPosition, DragSession, GridBounds, GridConfig, GridLayout, GridRect, ResizeHandle, ResizeSession } from "@/core/grid/types";

export { dockSizeRange } from "@/core/grid/types";

const defaultConfig: GridConfig = {
  columns: 12,
  rowHeight: 80,
  gapX: 8,
  gapY: 8,
};

interface AgileGridStore {
  state: AgileGridState;
  showOverlay: boolean;
  setActivePage: (page: number) => void;
  toggleOverlay: () => void;
  toggleEditing: () => void;
  setDockPosition: (position: DockPosition) => void;
  setDockSize: (size: number) => void;
  selectItem: (id?: string) => void;
  beginDrag: (id: string, page: number, pointerOffset: DragSession["pointerOffset"], bounds: DragSession["bounds"]) => boolean;
  previewDrag: (rect: GridRect) => void;
  commitDrag: () => void;
  cancelDrag: () => void;
  beginResize: (id: string, page: number, handle: ResizeHandle, pointerStart: ResizeSession["pointerStart"], bounds: ResizeSession["bounds"]) => boolean;
  previewResize: (pointerDelta: { x: number; y: number }) => void;
  commitResize: () => void;
  cancelResize: () => void;
  addItem: (item: AgileGridItem, bounds: GridBounds) => boolean;
  removeItem: (id: string, bounds: GridBounds) => void;
  adaptLayout: (bounds: GridBounds) => void;
  arrangeItems: (scope: "page" | "all", bounds: GridBounds) => void;
  drag: DragSession | null;
  resize: ResizeSession | null;
}

function sameLayout(a: GridLayout, b: GridLayout): boolean {
  return a.pages.length === b.pages.length && a.pages.every((page, index) => {
    const other = b.pages[index];
    return page.items.length === other.items.length && page.items.every((item, itemIndex) => {
      const candidate = other.items[itemIndex];
      return item.id === candidate.id && item.x === candidate.x && item.y === candidate.y && item.w === candidate.w && item.h === candidate.h;
    });
  });
}

export function createAgileGridStore(layout: GridLayout = demoLayout) {
  return createStore<AgileGridStore>()((set) => ({
    state: {
      version: 1,
      config: { ...defaultConfig },
      dock: { position: "top", size: 48, visible: true },
      layout: structuredClone(layout.pages.length ? layout : { pages: [{ items: [] }] }),
      activePage: 0,
      editing: false,
    },
    showOverlay: true,
    drag: null,
    resize: null,
    setActivePage: (page) => {
      if (!Number.isInteger(page)) return;
      set(({ state }) => ({
        state: {
          ...state,
          activePage: Math.max(0, Math.min(page, state.layout.pages.length - 1)),
          selectedItemId: undefined,
        },
        drag: null,
        resize: null,
      }));
    },
    toggleOverlay: () => set(({ showOverlay }) => ({ showOverlay: !showOverlay })),
    toggleEditing: () => set(({ state }) => ({ state: { ...state, editing: !state.editing, selectedItemId: undefined }, drag: null, resize: null })),
    setDockPosition: (position) => set(({ state }) => {
      if (!["top", "bottom", "left", "right"].includes(position) || position === state.dock.position) return {};
      return { state: { ...state, dock: { ...state.dock, position }, selectedItemId: undefined }, drag: null, resize: null };
    }),
    setDockSize: (size) => set(({ state }) => {
      if (!state.editing || !Number.isInteger(size) || size < dockSizeRange.min || size > dockSizeRange.max || size === state.dock.size) return {};
      return { state: { ...state, dock: { ...state.dock, size }, selectedItemId: undefined }, drag: null, resize: null };
    }),
    selectItem: (id) => set(({ state }) => {
      if (!state.editing || (id !== undefined && !state.layout.pages[state.activePage].items.some((item) => item.id === id))) return {};
      return { state: { ...state, selectedItemId: id } };
    }),
    beginDrag: (id, page, pointerOffset, bounds) => {
      let started = false;
      set(({ state, drag, resize }) => {
        if (!state.editing || drag || resize || page !== state.activePage) return {};
        const item = state.layout.pages[page]?.items.find((candidate) => candidate.id === id);
        if (!item || item.draggable === false || !fitsGrid(item, bounds)) return {};
        started = true;
        return { state: { ...state, selectedItemId: id }, resize: null, drag: { id, page, bounds, start: { x: item.x, y: item.y, w: item.w, h: item.h }, preview: { x: item.x, y: item.y, w: item.w, h: item.h }, previewLayout: structuredClone(state.layout), pointerOffset, blocked: false } };
      });
      return started;
    },
    previewDrag: (rect) => set(({ state, drag }) => {
      if (!drag) return {};
      const result = reflowDraggedItem(state.layout.pages, drag.page, drag.id, rect, drag.bounds);
      return result.success
        ? { drag: { ...drag, preview: result.placed, previewLayout: { pages: result.pages }, blocked: false } }
        : { drag: { ...drag, blocked: true } };
    }),
    commitDrag: () => set(({ state, drag }) => {
      if (!drag) return {};
      return drag.blocked
        ? { drag: null }
        : { state: { ...state, layout: drag.previewLayout }, drag: null };
    }),
    cancelDrag: () => set(({ drag }) => drag ? { drag: null } : {}),
    beginResize: (id, page, handle, pointerStart, bounds) => {
      let started = false;
      set(({ state, drag, resize }) => {
        if (!state.editing || drag || resize || page !== state.activePage) return {};
        const item = state.layout.pages[page]?.items.find((candidate) => candidate.id === id);
        if (!item || item.resizable === false || !fitsGrid(item, bounds)) return {};
        started = true;
        const start = { x: item.x, y: item.y, w: item.w, h: item.h };
        return { state: { ...state, selectedItemId: id }, drag: null, resize: { id, page, bounds, handle, start, preview: start, previewLayout: structuredClone(state.layout), pointerStart, blocked: false } };
      });
      return started;
    },
    previewResize: (pointerDelta) => set(({ state, resize }) => {
      if (!resize) return {};
      const source = state.layout.pages[resize.page]?.items.find((item) => item.id === resize.id);
      if (!source) return { resize: null };
      const requested = resizeRect(source, resize.handle, pointerDelta, resize.bounds);
      const result = reflowDraggedItem(state.layout.pages, resize.page, resize.id, requested, resize.bounds);
      return result.success
        ? { resize: { ...resize, preview: result.placed, previewLayout: { pages: result.pages }, blocked: false } }
        : { resize: { ...resize, blocked: true } };
    }),
    commitResize: () => set(({ state, resize }) => {
      if (!resize) return {};
      return resize.blocked
        ? { resize: null }
        : { state: { ...state, layout: resize.previewLayout }, resize: null };
    }),
    cancelResize: () => set(({ resize }) => resize ? { resize: null } : {}),
    addItem: (item, bounds) => {
      let added = false;
      set(({ state, drag, resize }) => {
        if (!state.editing || drag || resize) return {};
        const result = addGridItem(state.layout.pages, item, bounds);
        if (!result.success) return {};
        added = true;
        return { state: { ...state, layout: { pages: result.pages }, activePage: result.pages.findIndex((page) => page.items.some((candidate) => candidate.id === item.id)), selectedItemId: item.id } };
      });
      return added;
    },
    removeItem: (id, bounds) => set(({ state, drag, resize }) => {
      if (!state.editing || drag || resize || !state.layout.pages[state.activePage]?.items.some((item) => item.id === id)) return {};
      const remaining = state.layout.pages.map((page, index) => index === state.activePage ? { items: page.items.filter((item) => item.id !== id) } : page);
      const result = compactLayout(remaining, bounds);
      if (!result.success) return {};
      return { state: { ...state, layout: { pages: result.pages }, activePage: Math.min(state.activePage, result.pages.length - 1), selectedItemId: state.selectedItemId === id ? undefined : state.selectedItemId } };
    }),
    arrangeItems: (scope, bounds) => set(({ state, drag, resize }) => {
      if (!state.editing || drag || resize) return {};
      const result = scope === "page"
        ? compactPage(state.layout.pages, state.activePage, bounds)
        : compactLayout(state.layout.pages, bounds);
      if (!result.success) return {};
      return { state: { ...state, layout: { pages: result.pages }, activePage: Math.min(state.activePage, result.pages.length - 1), selectedItemId: undefined } };
    }),
    adaptLayout: (bounds) => set(({ state, drag, resize }) => {
      const result = adaptLayoutToBounds(state.layout.pages, bounds);
      if (!result.success) return drag || resize ? { drag: null, resize: null } : {};
      const layout = { pages: result.pages };
      if (sameLayout(state.layout, layout)) return drag || resize ? { drag: null, resize: null } : {};
      return { state: { ...state, layout, activePage: Math.min(state.activePage, result.pages.length - 1) }, drag: null, resize: null };
    }),
  }));
}
