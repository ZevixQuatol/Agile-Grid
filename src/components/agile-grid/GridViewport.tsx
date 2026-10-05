"use client";

import { useRef, type ReactNode } from "react";
import { fitsGrid } from "@/core/grid/coordinates";
import type { AgileGridItem, GridConfig, GridPage } from "@/core/grid/types";
import { useGridMetrics } from "@/hooks/useGridMetrics";
import { GridItem } from "./GridItem";
import { GridOverlay } from "./GridOverlay";

interface Props {
  page: GridPage;
  config: GridConfig;
  showOverlay: boolean;
  renderItem: (item: AgileGridItem) => ReactNode;
}

export function GridViewport({ page, config, showOverlay, renderItem }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(ref, config);
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const outside = metrics ? page.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;

  return (
    <main className="grid-workspace">
      <div
        ref={ref}
        className="grid-viewport"
        role="region"
        aria-label="网格视口"
        data-columns={metrics?.columns}
        data-rows={metrics?.rows}
        data-cell-width={metrics?.cellWidth}
        data-cell-height={metrics?.cellHeight}
        data-gap-x={metrics?.gapX}
        data-gap-y={metrics?.gapY}
      >
        {hasCapacity && showOverlay && <GridOverlay metrics={metrics} />}
        {canRender ? (
          page.items.map((item) => (
            <GridItem key={item.id} item={item} metrics={metrics} renderItem={renderItem} />
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
      <footer className="grid-status" aria-label="网格信息">
        <div className="metric-group">
          <span><b>{config.columns}</b> 列</span>
          <span><b>{metrics?.rows ?? "—"}</b> 行</span>
          <span className="metric-secondary">Cell <b>{metrics ? metrics.cellWidth.toFixed(2) : "—"}</b> × <b>{config.rowHeight}</b> px</span>
          <span className="metric-secondary">Gap <b>{config.gapX}</b> / <b>{config.gapY}</b> px</span>
        </div>
        <span className="status-mode"><i aria-hidden="true" />浏览模式 · 本页 {page.items.length} 个块</span>
      </footer>
    </main>
  );
}
