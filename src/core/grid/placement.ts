import { fitsGrid, rectsOverlap } from "./coordinates";
import type { AgileGridItem, GridBounds, GridPage, GridRect } from "./types";

export interface PlacementResult {
  pages: GridPage[];
  placed: GridRect;
  success: boolean;
}

function free(rect: GridRect, items: AgileGridItem[], bounds: GridBounds): boolean {
  return fitsGrid(rect, bounds) && items.every((item) => !rectsOverlap(rect, item));
}

function firstFit(item: AgileGridItem, items: AgileGridItem[], bounds: GridBounds, start: GridPoint = { x: 0, y: 0 }): GridRect | null {
  for (let y = start.y; y <= bounds.rows - item.h; y += 1) {
    for (let x = y === start.y ? start.x : 0; x <= bounds.columns - item.w; x += 1) {
      const rect = { x, y, w: item.w, h: item.h };
      if (free(rect, items, bounds)) return rect;
    }
  }
  return null;
}

interface GridPoint { x: number; y: number }

function canFitSize(item: GridRect, bounds: GridBounds): boolean {
  return fitsGrid({ x: 0, y: 0, w: item.w, h: item.h }, bounds);
}

export function reflowDraggedItem(
  pages: GridPage[],
  pageIndex: number,
  itemId: string,
  requested: GridRect,
  bounds: GridBounds,
): PlacementResult {
  const source = pages[pageIndex]?.items.find((item) => item.id === itemId);
  if (!source) return { pages, placed: requested, success: false };
  if (!fitsGrid(requested, bounds)) return { pages, placed: source, success: false };

  const nextPages = pages.map((page) => ({ items: page.items.map((item) => ({ ...item })) }));
  const moving = { ...source, ...requested };
  const displaced = nextPages[pageIndex].items.filter((item) => item.id !== itemId && rectsOverlap(requested, item));
  nextPages[pageIndex].items = nextPages[pageIndex].items.filter((item) => item.id !== itemId && !displaced.some((other) => other.id === item.id));
  nextPages[pageIndex].items.push({ ...moving, ...requested });

  let carry = displaced.sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  for (let i = 0; i < carry.length; i += 1) {
    const item = carry[i];
    if (!canFitSize(item, bounds)) return { pages, placed: source, success: false };
    let placed: GridRect | null = null;
    for (let page = pageIndex; page < nextPages.length && !placed; page += 1) {
      const candidates = nextPages[page].items.filter((candidate) => candidate.id !== item.id);
      placed = firstFit(item, candidates, bounds, page === pageIndex ? { x: requested.x + requested.w, y: requested.y } : { x: 0, y: 0 });
      if (placed) {
        nextPages[page].items = candidates.concat({ ...item, ...placed });
      }
    }
    if (!placed) {
      nextPages.push({ items: [] });
      placed = firstFit(item, [], bounds);
      if (placed) nextPages[nextPages.length - 1].items.push({ ...item, ...placed });
    }
    if (!placed) return { pages, placed: source, success: false };
  }

  return { pages: nextPages, placed: requested, success: true };
}
