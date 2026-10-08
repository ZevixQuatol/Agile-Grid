import { restoreLayout, serializeLayout } from "@/core/grid/serializer";
import type { createAgileGridStore } from "./agileGridStore";

export const gridStorageKey = "agile-grid:v1";

export function connectGridPersistence(
  store: ReturnType<typeof createAgileGridStore>,
  storage: Pick<Storage, "getItem" | "setItem">,
  onMessage: (message: string | null) => void,
) {
  let saved: string | null;
  let restoredOk = false;
  try {
    saved = storage.getItem(gridStorageKey);
  } catch {
    onMessage("无法读取本地布局，已载入演示布局；当前更改仅保留在本次会话。");
    return () => {};
  }
  if (saved !== null) {
    const restored = restoreLayout(saved);
    if (restored) {
      restoredOk = true;
      store.setState({
        state: { version: 1, config: restored.grid, dock: restored.dock, layout: { pages: restored.pages }, activePage: 0, editing: false },
        drag: null, resize: null, showOverlay: true,
      });
    } else {
      onMessage("本地布局无效或版本不兼容，已载入演示布局；编辑后将保存新布局。");
    }
  } else {
    onMessage("暂无本地布局，已载入演示布局。");
  }

  let previous = serializeLayout(store.getState().state);
  const save = (serialized: string) => {
    try {
      storage.setItem(gridStorageKey, serialized);
      return true;
    } catch {
      onMessage("布局保存失败，当前更改仅保留在本次会话。");
      return false;
    }
  };
  if (saved === null) save(previous);
  return store.subscribe((current, before) => {
    if (current.state.config === before.state.config && current.state.dock === before.state.dock && current.state.layout === before.state.layout) return;
    // Preserve unreadable data through automatic startup adaptation until a user edit.
    if (saved !== null && !restoredOk && !current.state.editing && current.state.config === before.state.config && current.state.dock === before.state.dock) return;
    const serialized = serializeLayout(current.state);
    if (serialized === previous) return;
    previous = serialized;
    restoredOk = true;
    if (save(serialized)) onMessage(null);
  });
}
