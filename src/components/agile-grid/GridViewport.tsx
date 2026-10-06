"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect } from "react";
import { dragToGrid } from "@/core/grid/coordinates";
import { fitsGrid } from "@/core/grid/coordinates";
import type { AgileGridItem, GridConfig, GridMetrics, GridPage } from "@/core/grid/types";
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
  onBeginDrag: (id: string, offset: { x: number; y: number }) => boolean;
  onPreviewDrag: (rect: { x: number; y: number; w: number; h: number }) => void;
  onCommitDrag: () => void;
  onCancelDrag: () => void;
  drag: { id: string; start: { x: number; y: number; w: number; h: number }; pointerOffset: { x: number; y: number } } | null;
}

export function GridViewport({ page, config, metrics, viewportRef, showOverlay, renderItem, editing, selectedItemId, onSelect, onBeginDrag, onPreviewDrag, onCommitDrag, onCancelDrag, drag }: Props) {
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const outside = metrics ? page.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;

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
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
    window.addEventListener("pointercancel", onCancelDrag, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", onCancelDrag);
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
        {canRender ? (
          page.items.map((item) => (
            <GridItem key={item.id} item={item} metrics={metrics} renderItem={renderItem} editing={editing} selected={item.id === selectedItemId} onSelect={onSelect} onPointerDown={(event, value) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
              if (editing) onBeginDrag(value.id, offset);
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
      </div>
    </main>
  );
}
