import type { AgileGridItem, GridBounds, GridRect, ResizeHandle } from "./types";

function limit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function resizeRect(
  item: AgileGridItem,
  handle: ResizeHandle,
  pointerDelta: { x: number; y: number },
  bounds: GridBounds,
): GridRect {
  const minW = Math.max(1, Math.min(item.minW ?? 1, bounds.columns));
  const minH = Math.max(1, Math.min(item.minH ?? 1, bounds.rows));
  const maxW = Math.max(1, Math.min(item.maxW ?? bounds.columns, bounds.columns - item.x));
  const maxH = Math.max(1, Math.min(item.maxH ?? bounds.rows, bounds.rows - item.y));
  const nextW = handle === "bottom" ? item.w : item.w + Math.round(pointerDelta.x);
  const nextH = handle === "right" ? item.h : item.h + Math.round(pointerDelta.y);

  return {
    x: item.x,
    y: item.y,
    w: limit(nextW, Math.min(minW, maxW), maxW),
    h: limit(nextH, Math.min(minH, maxH), maxH),
  };
}
