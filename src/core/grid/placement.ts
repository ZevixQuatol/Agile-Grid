import { fitsGrid, rectsOverlap } from "./coordinates";
import type { AgileGridItem, GridBounds, GridPage, GridRect } from "./types";

export interface PlacementResult {
  pages: GridPage[];
  placed: GridRect;
  success: boolean;
}

export interface LayoutResult {
  pages: GridPage[];
  success: boolean;
}

function validBounds(bounds: GridBounds): boolean {
  return Number.isInteger(bounds.columns) && bounds.columns > 0 && Number.isInteger(bounds.rows) && bounds.rows > 0;
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

function fitItem(item: AgileGridItem, bounds: GridBounds): AgileGridItem | null {
  if (!validBounds(bounds)) return null;
  const minW = Math.max(1, Math.min(Math.ceil(item.minW ?? 1), bounds.columns));
  const minH = Math.max(1, Math.min(Math.ceil(item.minH ?? 1), bounds.rows));
  const maxW = Math.max(1, Math.min(Math.floor(item.maxW ?? bounds.columns), bounds.columns));
  const maxH = Math.max(1, Math.min(Math.floor(item.maxH ?? bounds.rows), bounds.rows));
  const effectiveMinW = Math.min(minW, maxW);
  const effectiveMinH = Math.min(minH, maxH);
  const w = Math.max(effectiveMinW, Math.min(Math.floor(item.w), maxW));
  const h = Math.max(effectiveMinH, Math.min(Math.floor(item.h), maxH));
  return { ...item, w, h };
}

function placeForward(item: AgileGridItem, pages: GridPage[], bounds: GridBounds, startPage = 0): number | null {
  for (let page = startPage; page < pages.length; page += 1) {
    const position = firstFit(item, pages[page].items, bounds);
    if (!position) continue;
    pages[page].items.push({ ...item, ...position });
    return page;
  }

  pages.push({ items: [] });
  const position = firstFit(item, [], bounds);
  if (!position) return null;
  pages[pages.length - 1].items.push({ ...item, ...position });
  return pages.length - 1;
}

function trimTrailingPages(pages: GridPage[]): GridPage[] {
  while (pages.length > 1 && pages[pages.length - 1].items.length === 0) pages.pop();
  return pages.length ? pages : [{ items: [] }];
}

function orderedItems(pages: GridPage[]) {
  return pages.flatMap((page, pageIndex) => page.items.map((item) => ({ pageIndex, item })))
    .sort((a, b) => a.pageIndex - b.pageIndex || a.item.y - b.item.y || a.item.x - b.item.x || a.item.id.localeCompare(b.item.id));
}

export function addGridItem(pages: GridPage[], item: AgileGridItem, bounds: GridBounds): PlacementResult {
  if (!validBounds(bounds) || pages.some((page) => page.items.some((candidate) => candidate.id === item.id))) {
    return { pages, placed: item, success: false };
  }
  const fitted = fitItem(item, bounds);
  if (!fitted) return { pages, placed: item, success: false };

  const nextPages = pages.map((page) => ({ items: page.items.map((candidate) => ({ ...candidate })) }));
  if (!nextPages.length) nextPages.push({ items: [] });
  const pageIndex = placeForward(fitted, nextPages, bounds);
  if (pageIndex === null) return { pages, placed: item, success: false };
  const placed = nextPages[pageIndex].items.find((candidate) => candidate.id === item.id)!;
  return { pages: trimTrailingPages(nextPages), placed, success: true };
}

export function compactLayout(pages: GridPage[], bounds: GridBounds): LayoutResult {
  if (!validBounds(bounds)) return { pages, success: false };
  const nextPages: GridPage[] = [{ items: [] }];
  for (const { item } of orderedItems(pages)) {
    const fitted = fitItem(item, bounds);
    if (!fitted || placeForward(fitted, nextPages, bounds) === null) return { pages, success: false };
  }
  return { pages: trimTrailingPages(nextPages), success: true };
}

export function compactPage(pages: GridPage[], pageIndex: number, bounds: GridBounds): LayoutResult {
  const page = pages[pageIndex];
  if (!validBounds(bounds) || !page || page.items.some((item) => !fitsGrid(item, bounds))) return { pages, success: false };
  const items = page.items.map((item) => ({ ...item }));
  for (const { item } of orderedItems([{ items }])) {
    const others = items.filter((candidate) => candidate.id !== item.id);
    let placed = false;
    for (let y = 0; y <= item.y; y += 1) {
      if (!free({ ...item, y }, others, bounds)) continue;
      item.y = y;
      placed = true;
      break;
    }
    if (!placed) return { pages, success: false };
  }
  return { pages: pages.map((value, index) => index === pageIndex ? { items } : value), success: true };
}

export function adaptLayoutToBounds(pages: GridPage[], bounds: GridBounds): LayoutResult {
  if (!validBounds(bounds)) return { pages, success: false };
  const nextPages = pages.map(() => ({ items: [] as AgileGridItem[] }));
  if (!nextPages.length) nextPages.push({ items: [] });

  for (const { pageIndex, item } of orderedItems(pages)) {
    const fitted = fitItem(item, bounds);
    if (!fitted) return { pages, success: false };
    const preferredPage = nextPages[Math.min(pageIndex, nextPages.length - 1)];
    const original = { x: item.x, y: item.y, w: fitted.w, h: fitted.h };
    if (free(original, preferredPage.items, bounds)) {
      preferredPage.items.push({ ...fitted, ...original });
      continue;
    }
    if (placeForward(fitted, nextPages, bounds, pageIndex) === null) return { pages, success: false };
  }

  return { pages: trimTrailingPages(nextPages), success: true };
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
