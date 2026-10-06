export interface GridSize {
  w: number;
  h: number;
}

export interface GridRect extends GridSize {
  x: number;
  y: number;
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AgileGridItem extends GridRect {
  id: string;
  type: string;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  draggable?: boolean;
  resizable?: boolean;
  allowedSizes?: GridSize[];
}

export interface GridPage {
  items: AgileGridItem[];
}

export interface GridLayout {
  pages: GridPage[];
}

export interface GridBounds {
  columns: number;
  rows: number;
}

export interface GridConfig {
  columns: number;
  rowHeight: number;
  gapX: number;
  gapY: number;
}

export interface GridMetrics extends GridBounds {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  gapX: number;
  gapY: number;
}

export type DockPosition = "top" | "bottom" | "left" | "right";

export interface DockBarState {
  position: DockPosition;
  size: number;
  visible: boolean;
}

export interface AgileGridState {
  version: 1;
  config: GridConfig;
  dock: DockBarState;
  layout: GridLayout;
  activePage: number;
  selectedItemId?: string;
  editing: boolean;
}

export interface DragSession {
  id: string;
  page: number;
  start: GridRect;
  preview: GridRect;
  pointerOffset: GridPoint;
  blocked: boolean;
}
