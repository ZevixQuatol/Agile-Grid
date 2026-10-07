"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect } from "react";
import { dragToGrid, fitsGrid, gridToPixel } from "@/core/grid/coordinates";
import type { AgileGridItem, DragSession, GridConfig, GridMetrics, GridPage } from "@/core/grid/types";
import { GridItem } from "./GridItem";
import { GridOverlay } from "./GridOverlay";

interface Props {
  page: GridPage;
  config: GridConfig;
  metrics: GridMetrics | null;
  viewportRef: RefObject<HTMLDivElement | null>;
  showOverlay: boolean;
  renderItem: (item: AgileGridItem) => ReactNode;
  editing: boolean;
  selectedItemId?: string;
  onSelect: (id?: string) => void;
  onBeginDrag: (id: string, offset: { x: number; y: number }, bounds: { columns: number; rows: number }) => boolean;
  onPreviewDrag: (rect: { x: number; y: number; w: number; h: number }) => void;
  onCommitDrag: () => void;
  onCancelDrag: () => void;
  onDelete: (id: string) => void;
  drag: DragSession | null;
}

export function GridViewport({ page, config, metrics, viewportRef, showOverlay, renderItem, editing, selectedItemId, onSelect, onBeginDrag, onPreviewDrag, onCommitDrag, onCancelDrag, onDelete, drag }: Props) {
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const renderPage = drag?.previewLayout.pages[drag.page] ?? page;
  const outside = metrics ? renderPage.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;
  const dropPreview = drag && metrics && canRender ? gridToPixel(drag.preview, metrics) : null;

  useEffect(() => {
    if (!drag || !metrics || !viewportRef.current) return;
    const move = (event: PointerEvent) => {
      const bounds = viewportRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      const next = dragToGrid(drag.start, drag.pointerOffset, point, metrics);
      onPreviewDrag({ ...drag.start, ...next });
    };
    const end = () => onCommitDrag();
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") onCancelDrag(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
    window.addEventListener("pointercancel", onCancelDrag, { once: true });
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", onCancelDrag);
      window.removeEventListener("keydown", keydown);
    };
  }, [drag, metrics, onCancelDrag, onCommitDrag, onPreviewDrag, viewportRef]);

  return (
    <main className="grid-workspace" style={{ padding: `${config.gapY}px ${config.gapX}px` }}>
      <div
        ref={viewportRef}
        className="grid-viewport"
        role="region"
        aria-label="网格视口"
        data-columns={metrics?.columns}
        data-rows={metrics?.rows}
        data-cell-width={metrics?.cellWidth}
        data-cell-height={metrics?.cellHeight}
        data-gap-x={metrics?.gapX}
        data-gap-y={metrics?.gapY}
        onClick={(event) => { if (editing && event.target === event.currentTarget) onSelect(undefined); }}
      >
        {hasCapacity && showOverlay && <GridOverlay metrics={metrics} />}
        {dropPreview && (
          <div
            className="grid-placeholder"
            data-blocked={drag?.blocked}
            aria-hidden="true"
            style={{
              transform: `translate3d(${dropPreview.left}px, ${dropPreview.top}px, 0)`,
              width: dropPreview.width,
              height: dropPreview.height,
            }}
          />
        )}
        {canRender ? (
          renderPage.items.map((item) => (
            <GridItem key={item.id} item={drag?.id === item.id ? { ...item, ...drag.preview } : item} metrics={metrics} renderItem={renderItem} editing={editing} selected={item.id === selectedItemId} dragging={drag?.id === item.id} blocked={drag?.id === item.id && drag.blocked} onDelete={onDelete} onSelect={onSelect} onPointerDown={(event, value) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
              if (editing && metrics) onBeginDrag(value.id, offset, { columns: metrics.columns, rows: metrics.rows });
            }} />
          ))
        ) : (
          <div className="viewport-message" role="status">
            <span className="message-symbol" aria-hidden="true">{metrics ? "↗" : "…"}</span>
            <strong>{metrics ? "可用空间不足" : "正在测量网格"}</strong>
            <p>
              {metrics
                ? "增大窗口以查看当前布局，或切换其他页面。"
                : "正在计算当前页面的行列容量。"}
            </p>
            {outside.length > 0 && (
              <span className="message-detail">{outside.length} 个块超出当前页容量 · 数据已保留</span>
            )}
          </div>
        )}
        {drag?.blocked && <div className="drag-warning" role="status">被遮挡，无法放置</div>}
      </div>
    </main>
  );
}
