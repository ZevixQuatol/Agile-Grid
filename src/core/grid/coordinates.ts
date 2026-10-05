import type {
  GridBounds,
  GridConfig,
  GridMetrics,
  GridPoint,
  GridRect,
  PixelRect,
} from "./types";

export function getGridMetrics(
  width: number,
  height: number,
  config: GridConfig,
): GridMetrics {
  if (
    !Number.isFinite(width) || width < 0 ||
    !Number.isFinite(height) || height < 0 ||
    !Number.isInteger(config.columns) || config.columns < 1 ||
    !Number.isFinite(config.rowHeight) || config.rowHeight <= 0 ||
    !Number.isFinite(config.gapX) || config.gapX < 0 ||
    !Number.isFinite(config.gapY) || config.gapY < 0
  ) {
    throw new RangeError("Invalid grid dimensions or configuration");
  }

  return {
    width,
    height,
    columns: config.columns,
    rows: Math.floor((height + config.gapY) / (config.rowHeight + config.gapY)),
    cellWidth: Math.max(0, (width - (config.columns - 1) * config.gapX) / config.columns),
    cellHeight: config.rowHeight,
    gapX: config.gapX,
    gapY: config.gapY,
  };
}

export function fitsGrid(rect: GridRect, bounds: GridBounds): boolean {
  return (
    Number.isInteger(bounds.columns) && bounds.columns > 0 &&
    Number.isInteger(bounds.rows) && bounds.rows > 0 &&
    Number.isInteger(rect.x) && rect.x >= 0 &&
    Number.isInteger(rect.y) && rect.y >= 0 &&
    Number.isInteger(rect.w) && rect.w >= 1 &&
    Number.isInteger(rect.h) && rect.h >= 1 &&
    rect.x + rect.w <= bounds.columns &&
    rect.y + rect.h <= bounds.rows
  );
}

function requireCells(metrics: GridMetrics): void {
  if (
    !Number.isFinite(metrics.cellWidth) || metrics.cellWidth <= 0 ||
    !Number.isFinite(metrics.cellHeight) || metrics.cellHeight <= 0 ||
    !Number.isFinite(metrics.gapX) || metrics.gapX < 0 ||
    !Number.isFinite(metrics.gapY) || metrics.gapY < 0 ||
    !Number.isInteger(metrics.columns) || metrics.columns < 1 ||
    !Number.isInteger(metrics.rows) || metrics.rows < 1
  ) {
    throw new RangeError("Grid has no usable cell capacity");
  }
}

export function gridToPixel(rect: GridRect, metrics: GridMetrics): PixelRect {
  requireCells(metrics);
  if (!fitsGrid(rect, metrics)) {
    throw new RangeError("Grid rectangle exceeds page bounds or has invalid spans");
  }

  return {
    left: rect.x * (metrics.cellWidth + metrics.gapX),
    top: rect.y * (metrics.cellHeight + metrics.gapY),
    width: rect.w * metrics.cellWidth + (rect.w - 1) * metrics.gapX,
    height: rect.h * metrics.cellHeight + (rect.h - 1) * metrics.gapY,
  };
}

// Snap to the nearest cell origin. Boundary constraints are checked separately.
export function pixelToGrid(x: number, y: number, metrics: GridMetrics): GridPoint {
  requireCells(metrics);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new RangeError("Pixel coordinates must be finite");
  }

  return {
    x: Math.round(x / (metrics.cellWidth + metrics.gapX)),
    y: Math.round(y / (metrics.cellHeight + metrics.gapY)),
  };
}
