"use client";

import { useRef, useState } from "react";
import { useStore } from "zustand";
import type { AgileGridItem } from "@/core/grid/types";
import { createAgileGridStore } from "@/stores/agileGridStore";
import { useGridMetrics } from "@/hooks/useGridMetrics";
import { DemoWidget } from "@/components/widgets/DemoWidget";
import { GridViewport } from "./GridViewport";
import { PageNavigation } from "./PageNavigation";

function renderDemo(item: AgileGridItem) {
  return <DemoWidget item={item} />;
}

export function AgileGrid() {
  const [store] = useState(createAgileGridStore);
  const config = useStore(store, (value) => value.state.config);
  const layout = useStore(store, (value) => value.state.layout);
  const activePage = useStore(store, (value) => value.state.activePage);
  const showOverlay = useStore(store, (value) => value.showOverlay);
  const setActivePage = useStore(store, (value) => value.setActivePage);
  const toggleOverlay = useStore(store, (value) => value.toggleOverlay);
  const editing = useStore(store, (value) => value.state.editing);
  const selectedItemId = useStore(store, (value) => value.state.selectedItemId);
  const drag = useStore(store, (value) => value.drag);
  const toggleEditing = useStore(store, (value) => value.toggleEditing);
  const selectItem = useStore(store, (value) => value.selectItem);
  const beginDrag = useStore(store, (value) => value.beginDrag);
  const previewDrag = useStore(store, (value) => value.previewDrag);
  const commitDrag = useStore(store, (value) => value.commitDrag);
  const cancelDrag = useStore(store, (value) => value.cancelDrag);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") cancelDrag();
  };
  const viewportRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(viewportRef, config);
  const page = layout.pages[activePage];

  return (
    <div className="agile-grid-shell" onKeyDown={handleKeyDown} tabIndex={-1}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <h1>Agile Grid <span>灵巧网格</span></h1>
        </div>
        <div className="grid-status" role="group" aria-label="网格信息">
          <div className="metric-group">
            <span><b>{config.columns}</b> 列</span>
            <span><b>{metrics?.rows ?? "—"}</b> 行</span>
            <span className="metric-secondary">Cell <b>{metrics ? metrics.cellWidth.toFixed(2) : "—"}</b> × <b>{config.rowHeight}</b> px</span>
            <span className="metric-secondary">Gap <b>{config.gapX}</b> / <b>{config.gapY}</b> px</span>
          </div>
          <span className="status-mode"><i aria-hidden="true" />浏览模式 · 本页 {page.items.length} 个块</span>
        </div>
        <div className="header-actions">
          <button className="edit-toggle" type="button" aria-pressed={editing} onClick={toggleEditing}>{editing ? "完成" : "编辑"}</button>
          <PageNavigation activePage={activePage} pageCount={layout.pages.length} onPageChange={setActivePage} />
          <span className="header-divider" aria-hidden="true" />
          <button className="overlay-toggle" type="button" aria-pressed={showOverlay} onClick={toggleOverlay}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
            网格辅助线
          </button>
        </div>
      </header>
      <GridViewport page={page} config={config} metrics={metrics} viewportRef={viewportRef} showOverlay={showOverlay} renderItem={renderDemo} editing={editing} selectedItemId={selectedItemId} onSelect={selectItem} onBeginDrag={(id, offset) => beginDrag(id, activePage, offset)} onPreviewDrag={previewDrag} onCommitDrag={commitDrag} onCancelDrag={cancelDrag} drag={drag} />
    </div>
  );
}
