"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect } from "react";
import { dragToGrid, fitsGrid, gridToPixel } from "@/core/grid/coordinates";
import type { AgileGridItem, DragSession, GridConfig, GridMetrics, GridPage, ResizeHandle, ResizeSession } from "@/core/grid/types";
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
  onBeginResize: (id: string, handle: ResizeHandle, pointerStart: { x: number; y: number }, bounds: { columns: number; rows: number }) => boolean;
  onPreviewResize: (pointerDelta: { x: number; y: number }) => void;
  onCommitResize: () => void;
  onCancelResize: () => void;
  onDelete: (id: string) => void;
  drag: DragSession | null;
  resize: ResizeSession | null;
}

export function GridViewport({ page, config, metrics, viewportRef, showOverlay, renderItem, editing, selectedItemId, onSelect, onBeginDrag, onPreviewDrag, onCommitDrag, onCancelDrag, onBeginResize, onPreviewResize, onCommitResize, onCancelResize, onDelete, drag, resize }: Props) {
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const renderPage = resize?.previewLayout.pages[resize.page] ?? drag?.previewLayout.pages[drag.page] ?? page;
  const outside = metrics ? renderPage.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;
  const preview = resize?.preview ?? drag?.preview;
  const blocked = resize?.blocked ?? drag?.blocked ?? false;
  const dropPreview = preview && metrics && canRender ? gridToPixel(preview, metrics) : null;

  useEffect(() => {
    if ((!drag && !resize) || !metrics || !viewportRef.current) return;
    const move = (event: PointerEvent) => {
      const bounds = viewportRef.current?.getBoundingClientRect();
      if (!bounds) return;
      if (resize) {
        onPreviewResize({
          x: Math.round((event.clientX - resize.pointerStart.x) / (metrics.cellWidth + metrics.gapX)),
          y: Math.round((event.clientY - resize.pointerStart.y) / (metrics.cellHeight + metrics.gapY)),
        });
        return;
      }
      const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      const next = dragToGrid(drag!.start, drag!.pointerOffset, point, metrics);
      onPreviewDrag({ ...drag!.start, ...next });
    };
    const end = () => resize ? onCommitResize() : onCommitDrag();
    const cancel = () => resize ? onCancelResize() : onCancelDrag();
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", keydown);
    };
  }, [drag, metrics, onCancelDrag, onCancelResize, onCommitDrag, onCommitResize, onPreviewDrag, onPreviewResize, resize, viewportRef]);

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
            data-blocked={blocked}
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
            <GridItem key={item.id} item={drag?.id === item.id ? { ...item, ...drag.preview } : resize?.id === item.id ? { ...item, ...resize.preview } : item} metrics={metrics} renderItem={renderItem} editing={editing} selected={item.id === selectedItemId} dragging={drag?.id === item.id || resize?.id === item.id} blocked={(drag?.id === item.id && drag.blocked) || (resize?.id === item.id && resize.blocked)} onDelete={onDelete} onSelect={onSelect} onBeginResize={(event, value, handle) => {
              event.preventDefault();
              event.stopPropagation();
              if (editing && metrics) onBeginResize(value.id, handle, { x: event.clientX, y: event.clientY }, { columns: metrics.columns, rows: metrics.rows });
            }} onPointerDown={(event, value) => {
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
        {blocked && <div className="drag-warning" role="status">被遮挡，无法放置</div>}
      </div>
    </main>
  );
}
