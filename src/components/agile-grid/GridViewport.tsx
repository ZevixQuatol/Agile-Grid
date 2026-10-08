"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
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
  const capturedPointer = useRef<{ node: HTMLElement; id: number } | null>(null);
  const capture = (event: ReactPointerEvent<HTMLElement>) => {
    capturedPointer.current = { node: event.currentTarget, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const renderPage = resize?.previewLayout.pages[resize.page] ?? drag?.previewLayout.pages[drag.page] ?? page;
  const outside = metrics ? renderPage.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;
  const preview = resize?.preview ?? drag?.preview;
  const blocked = resize?.blocked ?? drag?.blocked ?? false;
  const dropPreview = preview && metrics && canRender ? gridToPixel(preview, metrics) : null;

  useEffect(() => {
    if (drag || resize) return;
    const pointer = capturedPointer.current;
    capturedPointer.current = null;
    if (pointer?.node.hasPointerCapture(pointer.id)) pointer.node.releasePointerCapture(pointer.id);
  }, [drag, resize]);

  useEffect(() => {
    if ((!drag && !resize) || !metrics || !viewportRef.current) return;
    let frame: number | null = null;
    let point: { x: number; y: number } | null = null;
    const flush = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      if (!point) return;
      const latest = point;
      point = null;
      const bounds = viewportRef.current?.getBoundingClientRect();
      if (!bounds) return;
      if (resize) {
        onPreviewResize({
          x: Math.round((latest.x - resize.pointerStart.x) / (metrics.cellWidth + metrics.gapX)),
          y: Math.round((latest.y - resize.pointerStart.y) / (metrics.cellHeight + metrics.gapY)),
        });
        return;
      }
      const next = dragToGrid(drag!.start, drag!.pointerOffset, { x: latest.x - bounds.left, y: latest.y - bounds.top }, metrics);
      onPreviewDrag({ ...drag!.start, ...next });
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== capturedPointer.current?.id) return;
      point = { x: event.clientX, y: event.clientY };
      if (frame === null) frame = requestAnimationFrame(flush);
    };
    const end = (event: PointerEvent) => { if (event.pointerId === capturedPointer.current?.id) { flush(); resize ? onCommitResize() : onCommitDrag(); } };
    const cancel = (event: PointerEvent) => { if (event.pointerId === capturedPointer.current?.id) resize ? onCancelResize() : onCancelDrag(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [drag, metrics, onCancelDrag, onCancelResize, onCommitDrag, onCommitResize, onPreviewDrag, onPreviewResize, resize, viewportRef]);

  return (
    <main className="grid-workspace" style={{ padding: `${config.gapY}px ${config.gapX}px` }}>
      <div
        ref={viewportRef}
        className="grid-viewport"
        role="region"
        aria-label="网格视口"
        tabIndex={-1}
        data-columns={metrics?.columns}
        data-rows={metrics?.rows}
        data-cell-width={metrics?.cellWidth}
        data-cell-height={metrics?.cellHeight}
        data-gap-x={metrics?.gapX}
        data-gap-y={metrics?.gapY}
        onClick={(event) => { if (editing && event.target === event.currentTarget) { onSelect(undefined); event.currentTarget.focus({ preventScroll: true }); } }}
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
          // Keep DOM order stable when reflow reorders items, preserving Pointer Capture.
          [...renderPage.items].sort((a, b) => a.id.localeCompare(b.id)).map((item) => (
            <GridItem key={item.id} item={drag?.id === item.id ? { ...item, ...drag.preview } : resize?.id === item.id ? { ...item, ...resize.preview } : item} metrics={metrics} renderItem={renderItem} editing={editing} selected={editing && item.id === selectedItemId} dragging={drag?.id === item.id || resize?.id === item.id} blocked={(drag?.id === item.id && drag.blocked) || (resize?.id === item.id && resize.blocked)} onDelete={onDelete} onSelect={onSelect} onPointerCancel={(event) => { if (event.pointerId === capturedPointer.current?.id) { onCancelDrag(); onCancelResize(); } }} onBeginResize={(event, value, handle) => {
              if (event.button !== 0 || !event.isPrimary) return;
              event.preventDefault();
              event.stopPropagation();
              if (editing && metrics && onBeginResize(value.id, handle, { x: event.clientX, y: event.clientY }, { columns: metrics.columns, rows: metrics.rows })) capture(event);
            }} onPointerDown={(event, value) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
              if (editing && metrics && onBeginDrag(value.id, offset, { columns: metrics.columns, rows: metrics.rows })) capture(event);
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
