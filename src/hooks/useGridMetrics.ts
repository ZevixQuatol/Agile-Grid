"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { getGridMetrics } from "@/core/grid/coordinates";
import type { GridConfig } from "@/core/grid/types";

export function useGridMetrics(
  ref: RefObject<HTMLDivElement | null>,
  config: GridConfig,
  enabled = true,
) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    const measure = (width: number, height: number) => {
      setSize((previous) =>
        previous?.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };

    const initialBounds = node.getBoundingClientRect();
    measure(initialBounds.width, initialBounds.height);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      measure(width, height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return useMemo(
    () => enabled && size ? getGridMetrics(size.width, size.height, config) : null,
    [size, config, enabled],
  );
}
