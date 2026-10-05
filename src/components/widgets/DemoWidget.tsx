import type { AgileGridItem } from "@/core/grid/types";

export function DemoWidget({ item }: { item: AgileGridItem }) {
  return (
    <div className="demo-widget">
      <span className="widget-type">{item.type}</span>
      <strong className="widget-size">{item.w} × {item.h}</strong>
      <span className="widget-coordinate">x:{item.x} · y:{item.y}</span>
    </div>
  );
}
