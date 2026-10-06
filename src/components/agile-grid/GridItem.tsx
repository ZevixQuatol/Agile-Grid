import { memo, type PointerEvent, type ReactNode } from "react";
import { gridToPixel } from "@/core/grid/coordinates";
import type { AgileGridItem, GridMetrics } from "@/core/grid/types";

interface Props {
  item: AgileGridItem;
  metrics: GridMetrics;
  renderItem: (item: AgileGridItem) => ReactNode;
  editing: boolean;
  selected: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>, item: AgileGridItem) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  dragging?: boolean;
  blocked?: boolean;
}

export const GridItem = memo(function GridItem({ item, metrics, renderItem, editing, selected, onPointerDown, onSelect, onPointerMove, onPointerUp, onPointerCancel, onDelete, dragging, blocked }: Props) {
  const rect = gridToPixel(item, metrics);

  return (
    <section
      className="grid-item"
      data-selected={selected}
      data-editing={editing}
      data-dragging={dragging}
      data-blocked={blocked}
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
      onPointerDown={(event) => {
        if (editing) event.preventDefault();
        onSelect(item.id);
        if (editing) onPointerDown(event, item);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {editing && <button className="item-delete" type="button" aria-label={`删除 ${item.id}`} title="删除块" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete(item.id); }}>−</button>}
      {renderItem(item)}
    </section>
  );
});
