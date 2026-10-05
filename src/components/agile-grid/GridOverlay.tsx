import type { GridMetrics } from "@/core/grid/types";

export function GridOverlay({ metrics }: { metrics: GridMetrics }) {
  return (
    <div
      className="grid-overlay"
      aria-hidden="true"
      style={{
        gridTemplateColumns: `repeat(${metrics.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${metrics.rows}, ${metrics.cellHeight}px)`,
        columnGap: metrics.gapX,
        rowGap: metrics.gapY,
      }}
    >
      {Array.from({ length: metrics.columns * metrics.rows }, (_, index) => (
        <div className="grid-cell" key={index}>
          <span>{index % metrics.columns},{Math.floor(index / metrics.columns)}</span>
        </div>
      ))}
    </div>
  );
}
