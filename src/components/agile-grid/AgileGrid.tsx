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
  const [aboutOpen, setAboutOpen] = useState(false);
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
  const removeItem = useStore(store, (value) => value.removeItem);
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
          <button
            className="icon-button about-button"
            type="button"
            aria-label="关于 Agile Grid 灵巧网格"
            aria-expanded={aboutOpen}
            title="关于 Agile Grid / 灵巧网格"
            onClick={() => setAboutOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 10.5v5" />
              <path d="M12 7.5h.01" />
            </svg>
          </button>
          {aboutOpen && (
            <div className="about-popover" role="dialog" aria-label="关于 Agile Grid">
              <strong>Agile Grid</strong>
              <span>灵巧网格</span>
            </div>
          )}
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
          <button
            className="icon-button edit-toggle"
            type="button"
            aria-label={editing ? "完成编辑" : "进入编辑模式"}
            aria-pressed={editing}
            title={editing ? "完成编辑" : "进入编辑模式"}
            onClick={toggleEditing}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m4 16.5-.75 3.25L6.5 19 17.75 7.75a2.12 2.12 0 0 0-3-3L3.25 16" />
              <path d="m13.5 6.5 4 4" />
            </svg>
          </button>
          <PageNavigation activePage={activePage} pageCount={layout.pages.length} onPageChange={setActivePage} />
          <button
            className="icon-button overlay-toggle"
            type="button"
            aria-label="网格辅助线"
            aria-pressed={showOverlay}
            title="网格辅助线"
            onClick={toggleOverlay}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </header>
      <GridViewport page={page} config={config} metrics={metrics} viewportRef={viewportRef} showOverlay={showOverlay} renderItem={renderDemo} editing={editing} selectedItemId={selectedItemId} onSelect={selectItem} onBeginDrag={(id, offset, bounds) => beginDrag(id, activePage, offset, bounds)} onPreviewDrag={previewDrag} onCommitDrag={commitDrag} onCancelDrag={cancelDrag} onDelete={removeItem} drag={drag} />
    </div>
  );
}
