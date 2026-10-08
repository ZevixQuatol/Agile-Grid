import { rectsOverlap } from "./coordinates";
import { dockSizeRange, type AgileGridItem, type AgileGridState, type DockBarState, type GridConfig, type GridPage } from "./types";

export interface PersistedGrid {
  version: 1;
  grid: GridConfig;
  dock: DockBarState;
  pages: GridPage[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function integer(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min;
}

function finite(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min;
}

function validItem(value: unknown): value is AgileGridItem {
  if (!record(value) || typeof value.id !== "string" || !value.id.trim() || typeof value.type !== "string" || !value.type.trim()) return false;
  if (!integer(value.x, 0) || !integer(value.y, 0) || !integer(value.w, 1) || !integer(value.h, 1) || !Number.isSafeInteger(value.x + value.w) || !Number.isSafeInteger(value.y + value.h)) return false;
  for (const key of ["minW", "minH", "maxW", "maxH"]) {
    if (value[key] !== undefined && !integer(value[key], 1)) return false;
  }
  if (typeof value.maxW === "number" && value.maxW < (typeof value.minW === "number" ? value.minW : 1)) return false;
  if (typeof value.maxH === "number" && value.maxH < (typeof value.minH === "number" ? value.minH : 1)) return false;
  for (const key of ["draggable", "resizable"]) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") return false;
  }
  return value.allowedSizes === undefined || (Array.isArray(value.allowedSizes) && value.allowedSizes.every((size) => record(size) && integer(size.w, 1) && integer(size.h, 1)));
}

function itemData(item: AgileGridItem): AgileGridItem {
  return {
    id: item.id, type: item.type, x: item.x, y: item.y, w: item.w, h: item.h,
    minW: item.minW, minH: item.minH, maxW: item.maxW, maxH: item.maxH,
    draggable: item.draggable, resizable: item.resizable,
    allowedSizes: item.allowedSizes?.map(({ w, h }) => ({ w, h })),
  };
}

function persistedData(grid: GridConfig, dock: DockBarState, pages: GridPage[]): PersistedGrid {
  return {
    version: 1,
    grid: { columns: grid.columns, rowHeight: grid.rowHeight, gapX: grid.gapX, gapY: grid.gapY },
    dock: { position: dock.position, size: dock.size, visible: dock.visible },
    pages: pages.map((page) => ({ items: page.items.map(itemData).sort((a, b) => a.id.localeCompare(b.id)) })),
  };
}

export function serializeLayout(state: AgileGridState): string {
  return JSON.stringify(persistedData(state.config, state.dock, state.layout.pages));
}

export function restoreLayout(serialized: string): PersistedGrid | null {
  try {
    const value: unknown = JSON.parse(serialized);
    if (!record(value) || value.version !== 1 || !record(value.grid) || !record(value.dock) || !Array.isArray(value.pages) || value.pages.length === 0) return null;
    const { grid, dock, pages } = value;
    if (!integer(grid.columns, 1) || !finite(grid.rowHeight, 0) || grid.rowHeight === 0 || !finite(grid.gapX, 0) || !finite(grid.gapY, 0) || !Number.isFinite(grid.rowHeight + grid.gapY) || !Number.isFinite(grid.columns * grid.gapX)) return null;
    if (dock.position !== "top" && dock.position !== "bottom" && dock.position !== "left" && dock.position !== "right") return null;
    if (!integer(dock.size, dockSizeRange.min) || dock.size > dockSizeRange.max || typeof dock.visible !== "boolean") return null;
    const ids = new Set<string>();
    const restoredPages: GridPage[] = [];
    for (const page of pages) {
      if (!record(page) || !Array.isArray(page.items)) return null;
      const items: AgileGridItem[] = [];
      for (const item of page.items) {
        if (!validItem(item) || ids.has(item.id) || items.some((other) => rectsOverlap(item, other))) return null;
        ids.add(item.id);
        items.push(item);
      }
      restoredPages.push({ items });
    }
    // Saved coordinates can exceed today's capacity; the caller adapts after measuring.
    return persistedData({ columns: grid.columns, rowHeight: grid.rowHeight, gapX: grid.gapX, gapY: grid.gapY }, { position: dock.position, size: dock.size, visible: dock.visible }, restoredPages);
  } catch {
    return null;
  }
}
