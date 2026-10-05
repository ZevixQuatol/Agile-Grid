"use client";

import { useState } from "react";
import { useStore } from "zustand";
import type { AgileGridItem } from "@/core/grid/types";
import { createAgileGridStore } from "@/stores/agileGridStore";
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

  return (
    <div className="agile-grid-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <h1>Agile Grid <span>灵巧网格</span></h1>
        </div>
        <div className="header-actions">
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
      <GridViewport page={layout.pages[activePage]} config={config} showOverlay={showOverlay} renderItem={renderDemo} />
    </div>
  );
}
