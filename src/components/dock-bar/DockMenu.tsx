import { useId, type ReactNode } from "react";
import type { DockBarState, DockPosition } from "@/core/grid/types";
import { dockSizeRange } from "@/stores/agileGridStore";

interface Props {
  dock: DockBarState;
  editing: boolean;
  onPositionChange: (position: DockPosition) => void;
  onSizeChange: (size: number) => void;
  children: ReactNode;
}

export function DockMenu({ dock, editing, onPositionChange, onSizeChange, children }: Props) {
  const id = useId();
  return (
    <>
      <button className="icon-button" type="button" aria-label="Dock 设置" title="Dock 设置" popoverTarget={id}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
        </svg>
      </button>
      <div className="dock-popover dock-menu" id={id} popover="auto" role="dialog" aria-label="Dock 设置">
        <strong>Dock 设置</strong>
        <label>
          方向
          <select aria-label="Dock 方向" value={dock.position} onChange={(event) => onPositionChange(event.target.value as DockPosition)}>
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
            <option value="left">左侧</option>
            <option value="right">右侧</option>
          </select>
        </label>
        <label>
          厚度 · {dock.size} px
          <input type="range" aria-label="Dock 厚度" min={dockSizeRange.min} max={dockSizeRange.max} step={1} value={dock.size} disabled={!editing} onChange={(event) => onSizeChange(event.target.valueAsNumber)} />
        </label>
        {!editing && <small>进入编辑模式可调整厚度</small>}
        <div className="dock-overflow" role="group" aria-label="网格操作">{children}</div>
      </div>
    </>
  );
}
