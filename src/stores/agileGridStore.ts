import { createStore } from "zustand/vanilla";
import demoLayout from "@/data/demo-layout.json";
import { reflowDraggedItem } from "@/core/grid/placement";
import { resizeRect } from "@/core/grid/resize";
import type { AgileGridState, DragSession, GridConfig, GridLayout, GridRect, ResizeHandle, ResizeSession } from "@/core/grid/types";

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
  selectItem: (id?: string) => void;
  beginDrag: (id: string, page: number, pointerOffset: DragSession["pointerOffset"], bounds: DragSession["bounds"]) => boolean;
  previewDrag: (rect: GridRect) => void;
  commitDrag: () => void;
  cancelDrag: () => void;
  beginResize: (id: string, page: number, handle: ResizeHandle, pointerStart: ResizeSession["pointerStart"], bounds: ResizeSession["bounds"]) => boolean;
  previewResize: (pointerDelta: { x: number; y: number }) => void;
  commitResize: () => void;
  cancelResize: () => void;
  removeItem: (id: string) => void;
  drag: DragSession | null;
  resize: ResizeSession | null;
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
        },
        drag: null,
        resize: null,
      }));
    },
    toggleOverlay: () => set(({ showOverlay }) => ({ showOverlay: !showOverlay })),
    toggleEditing: () => set(({ state }) => ({ state: { ...state, editing: !state.editing, selectedItemId: undefined }, drag: null, resize: null })),
    selectItem: (id) => set(({ state }) => ({ state: { ...state, selectedItemId: id } })),
    beginDrag: (id, page, pointerOffset, bounds) => {
      let started = false;
      set(({ state }) => {
        if (!state.editing || page !== state.activePage) return {};
        const item = state.layout.pages[page]?.items.find((candidate) => candidate.id === id);
        if (!item) return {};
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
      set(({ state }) => {
        if (!state.editing || page !== state.activePage) return {};
        const item = state.layout.pages[page]?.items.find((candidate) => candidate.id === id);
        if (!item) return {};
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
    removeItem: (id) => set(({ state, drag, resize }) => {
      if (!state.editing) return {};
      const pages = state.layout.pages.map((page, index) => index === state.activePage ? { items: page.items.filter((item) => item.id !== id) } : page);
      return { state: { ...state, layout: { pages }, selectedItemId: state.selectedItemId === id ? undefined : state.selectedItemId }, drag: drag?.id === id ? null : drag, resize: resize?.id === id ? null : resize };
    }),
  }));
}
