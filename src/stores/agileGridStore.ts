import { createStore } from "zustand/vanilla";
import demoLayout from "@/data/demo-layout.json";
import type { AgileGridState, GridConfig, GridLayout } from "@/core/grid/types";

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
  }));
}
