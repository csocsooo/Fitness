"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/store";
import { getSyncCode, pullState, pushState, useSyncCode } from "@/lib/sync";

// Egyszerű "last-write-wins" sync. Az app állapot egy `savedAt` timestamppel együtt
// kerül a KV-be. Indításkor:
//   1) Lehúzzuk a felhőből az állapotot
//   2) Ha a felhő frissebb mint a lokál, beolvasztjuk
//   3) Ha a lokál frissebb, feltöltjük
// Aztán minden lokális változásra debounce-olva pusholunk (~3 mp).

const PUSH_DEBOUNCE_MS = 3000;
const STATE_TS_KEY = "calisthenics-local-ts";

function localTs(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(STATE_TS_KEY) || "0", 10) || 0;
}
function setLocalTs(ts: number) {
  localStorage.setItem(STATE_TS_KEY, String(ts));
}

export default function SyncProvider() {
  const code = useSyncCode();
  const { state, ready, update } = useAppState();
  const [initDone, setInitDone] = useState(false);
  const lastPushedJson = useRef<string>("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Indító sync: lehúzzuk, beolvasztjuk vagy feltöltjük
  useEffect(() => {
    if (!ready || !code || initDone) return;
    (async () => {
      const r = await pullState(code);
      if (!r.ok || !r.data) {
        // Üres a felhő → töltsük fel
        const ts = Date.now();
        setLocalTs(ts);
        await pushState(code, state);
        lastPushedJson.current = JSON.stringify(state);
        setInitDone(true);
        return;
      }
      const cloud = r.data as { state: any; savedAt: number };
      const lts = localTs();
      if ((cloud.savedAt || 0) > lts) {
        // Felhő frissebb → beolvasztjuk
        update(() => cloud.state);
        setLocalTs(cloud.savedAt);
        lastPushedJson.current = JSON.stringify(cloud.state);
      } else if ((cloud.savedAt || 0) < lts) {
        // Lokál frissebb → feltöltjük
        await pushState(code, state);
        lastPushedJson.current = JSON.stringify(state);
      } else {
        lastPushedJson.current = JSON.stringify(state);
      }
      setInitDone(true);
    })();
  }, [ready, code, initDone]);

  // Folyamatos auto-push debounce-olva
  useEffect(() => {
    if (!ready || !code || !initDone) return;
    const cur = JSON.stringify(state);
    if (cur === lastPushedJson.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const ts = Date.now();
      setLocalTs(ts);
      const r = await pushState(code, state);
      if (r.ok) lastPushedJson.current = cur;
    }, PUSH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [state, ready, code, initDone]);

  // Reset initDone ha a kód változik
  useEffect(() => {
    setInitDone(false);
    lastPushedJson.current = "";
  }, [code]);

  return null;
}
