"use client";

import type { ReactNode, RefObject } from "react";
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
}

export function GridViewport({ page, config, metrics, viewportRef, showOverlay, renderItem }: Props) {
  const hasCapacity = metrics !== null && metrics.cellWidth > 0 && metrics.rows > 0;
  const outside = metrics ? page.items.filter((item) => !fitsGrid(item, metrics)) : [];
  const canRender = hasCapacity && outside.length === 0;

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
    </main>
  );
}
