"use client";

import { useEffect, useRef, useState } from "react";

const SYNC_KEY = "calisthenics-sync-code";
const LAST_SYNC_KEY = "calisthenics-sync-last";

export function getSyncCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SYNC_KEY);
}

export function setSyncCode(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) localStorage.setItem(SYNC_KEY, code);
  else localStorage.removeItem(SYNC_KEY);
  window.dispatchEvent(new Event("sync-config-changed"));
}

export function generateSyncCode(): string {
  // 12 karakter, biztonságos hash. Mind számjegy + alfanum.
  const arr = new Uint8Array(9);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(36)).join("").slice(0, 12);
}

export async function pushState(code: string, state: any): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state, savedAt: Date.now() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false, error: j.error || `HTTP ${res.status}` };
    }
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function pullState(code: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false, error: j.error || `HTTP ${res.status}` };
    }
    const j = await res.json();
    return { ok: true, data: j.data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function getLastSyncTs(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(LAST_SYNC_KEY) || "0", 10) || 0;
}

// Hook: figyeli a sync configot, és visszaadja a kódot + reaktív frissítést
export function useSyncCode() {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    setCode(getSyncCode());
    const handler = () => setCode(getSyncCode());
    window.addEventListener("sync-config-changed", handler);
    return () => window.removeEventListener("sync-config-changed", handler);
  }, []);
  return code;
}
