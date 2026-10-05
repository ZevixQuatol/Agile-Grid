import { memo, type ReactNode } from "react";
import { gridToPixel } from "@/core/grid/coordinates";
import type { AgileGridItem, GridMetrics } from "@/core/grid/types";

interface Props {
  item: AgileGridItem;
  metrics: GridMetrics;
  renderItem: (item: AgileGridItem) => ReactNode;
}

export const GridItem = memo(function GridItem({ item, metrics, renderItem }: Props) {
  const rect = gridToPixel(item, metrics);

  return (
    <section
      className="grid-item"
      aria-label={item.id}
      data-item-id={item.id}
      data-type={item.type}
      data-x={item.x}
      data-y={item.y}
      data-w={item.w}
      data-h={item.h}
      style={{
        transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
        width: rect.width,
        height: rect.height,
      }}
    >
      {renderItem(item)}
    </section>
  );
});
