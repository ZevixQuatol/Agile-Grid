"use client";

import { useEffect, useState } from "react";
import type { createAgileGridStore } from "@/stores/agileGridStore";
import { connectGridPersistence } from "@/stores/gridPersistence";

export function useGridPersistence(store: ReturnType<typeof createAgileGridStore>) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let disconnect: (() => void) | undefined;
    try {
      disconnect = connectGridPersistence(store, window.localStorage, setMessage);
    } catch {
      setMessage("本地存储不可用，当前更改仅保留在本次会话。");
    }
    setReady(true);
    return () => disconnect?.();
  }, [store]);
  useEffect(() => {
    if (!message || message.includes("仅保留")) return;
    const timer = window.setTimeout(() => setMessage(null), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return { ready, message };
}
