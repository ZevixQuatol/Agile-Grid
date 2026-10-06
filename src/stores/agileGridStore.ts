import { createStore } from "zustand/vanilla";
import demoLayout from "@/data/demo-layout.json";
import type { AgileGridState, DragSession, GridConfig, GridLayout, GridRect } from "@/core/grid/types";

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
  beginDrag: (id: string, page: number, pointerOffset: DragSession["pointerOffset"]) => boolean;
  previewDrag: (rect: GridRect) => void;
  commitDrag: () => void;
  cancelDrag: () => void;
  drag: DragSession | null;
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
    setActivePage: (page) => {
      if (!Number.isInteger(page)) return;
      set(({ state }) => ({
        state: {
          ...state,
          activePage: Math.max(0, Math.min(page, state.layout.pages.length - 1)),
        },
      }));
    },
    toggleOverlay: () => set(({ showOverlay }) => ({ showOverlay: !showOverlay })),
    toggleEditing: () => set(({ state }) => ({ state: { ...state, editing: !state.editing, selectedItemId: undefined }, drag: null })),
    selectItem: (id) => set(({ state }) => ({ state: { ...state, selectedItemId: id } })),
    beginDrag: (id, page, pointerOffset) => {
      let started = false;
      set(({ state }) => {
        if (!state.editing || page !== state.activePage) return {};
        const item = state.layout.pages[page]?.items.find((candidate) => candidate.id === id);
        if (!item) return {};
        started = true;
        return { state: { ...state, selectedItemId: id }, drag: { id, page, start: { x: item.x, y: item.y, w: item.w, h: item.h }, preview: { x: item.x, y: item.y, w: item.w, h: item.h }, pointerOffset } };
      });
      return started;
    },
    previewDrag: (rect) => set(({ drag }) => drag ? { drag: { ...drag, preview: rect } } : {}),
    commitDrag: () => set(({ state, drag }) => {
      if (!drag) return {};
      const pages = state.layout.pages.map((page, index) => index !== drag.page ? page : { items: page.items.map((item) => item.id === drag.id ? { ...item, ...drag.preview } : item) });
      return { state: { ...state, layout: { pages } }, drag: null };
    }),
    cancelDrag: () => set(({ drag }) => drag ? { drag: null } : {}),
  }));
}
