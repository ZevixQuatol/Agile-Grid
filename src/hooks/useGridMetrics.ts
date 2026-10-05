"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { getGridMetrics } from "@/core/grid/coordinates";
import type { GridConfig } from "@/core/grid/types";

export function useGridMetrics(
  ref: RefObject<HTMLDivElement | null>,
  config: GridConfig,
) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous?.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return useMemo(
    () => size ? getGridMetrics(size.width, size.height, config) : null,
    [size, config],
  );
}
