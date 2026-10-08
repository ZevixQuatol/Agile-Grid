import { memo, type PointerEvent, type ReactNode } from "react";
import { gridToPixel } from "@/core/grid/coordinates";
import type { AgileGridItem, GridMetrics, ResizeHandle } from "@/core/grid/types";

interface Props {
  item: AgileGridItem;
  metrics: GridMetrics;
  renderItem: (item: AgileGridItem) => ReactNode;
  editing: boolean;
  selected: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>, item: AgileGridItem) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onBeginResize: (event: PointerEvent<HTMLElement>, item: AgileGridItem, handle: ResizeHandle) => void;
  dragging?: boolean;
  blocked?: boolean;
}

export const GridItem = memo(function GridItem({ item, metrics, renderItem, editing, selected, onPointerDown, onSelect, onPointerMove, onPointerUp, onPointerCancel, onDelete, onBeginResize, dragging, blocked }: Props) {
  const rect = gridToPixel(item, metrics);

  return (
    <section
      className="grid-item"
      data-selected={selected}
      data-editing={editing}
      data-draggable={item.draggable !== false}
      data-dragging={dragging}
      data-blocked={blocked}
      aria-label={item.id}
      data-item-id={item.id}
      data-type={item.type}
      data-x={item.x}
      data-y={item.y}
      data-w={item.w}
      data-h={item.h}
      tabIndex={editing ? 0 : undefined}
      onFocus={(event) => { if (editing && event.target === event.currentTarget) onSelect(item.id); }}
      style={{
        transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
        width: rect.width,
        height: rect.height,
      }}
      onPointerDown={(event) => {
        if (!editing || event.button !== 0 || !event.isPrimary) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        onSelect(item.id);
        if (item.draggable !== false) onPointerDown(event, item);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
    >
      {editing && <button className="item-delete" type="button" aria-label={`删除 ${item.id}`} title="删除块" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete(item.id); }}>−</button>}
      {editing && selected && item.resizable !== false && (
        <>
          <button className="resize-handle resize-right" type="button" aria-label={`调整 ${item.id} 宽度`} title="调整宽度" onPointerDown={(event) => onBeginResize(event, item, "right")} />
          <button className="resize-handle resize-bottom" type="button" aria-label={`调整 ${item.id} 高度`} title="调整高度" onPointerDown={(event) => onBeginResize(event, item, "bottom")} />
          <button className="resize-handle resize-corner" type="button" aria-label={`调整 ${item.id} 大小`} title="调整大小" onPointerDown={(event) => onBeginResize(event, item, "corner")} />
        </>
      )}
      <div className="grid-item-content" inert={editing}>{renderItem(item)}</div>
    </section>
  );
});
