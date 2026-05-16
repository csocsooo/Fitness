"use client";

import { useEffect, useState } from "react";
import { useAppState, exportState, importState, resetState } from "@/lib/store";
import {
  generateSyncCode,
  getSyncCode,
  pullState,
  pushState,
  setSyncCode,
  useSyncCode,
} from "@/lib/sync";

export default function Beallitasok() {
  const { state, ready, update } = useAppState();
  const [exportData, setExportData] = useState<string>("");
  const [importData, setImportData] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">Beállítások</h1>
        <p className="text-muted">Profil, adatok kezelése.</p>
      </header>

      <section className="card space-y-4">
        <h2 className="h2">Profil</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Név">
            <input
              className="input w-full"
              value={state.profile.name}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))
              }
            />
          </Field>
          <Field label="Életkor">
            <input
              type="number"
              className="input w-full"
              value={state.profile.age}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, age: parseInt(e.target.value) || 0 } }))
              }
            />
          </Field>
          <Field label="Magasság (cm)">
            <input
              type="number"
              className="input w-full"
              value={state.profile.heightCm}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, heightCm: parseInt(e.target.value) || 0 } }))
              }
            />
          </Field>
          <Field label="Kezdő súly (kg)">
            <input
              type="number"
              step="0.1"
              className="input w-full"
              value={state.profile.startWeightKg}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, startWeightKg: parseFloat(e.target.value) || 0 } }))
              }
            />
          </Field>
          <Field label="Célsúly (kg)">
            <input
              type="number"
              step="0.1"
              className="input w-full"
              value={state.profile.goalWeightKg}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, goalWeightKg: parseFloat(e.target.value) || 0 } }))
              }
            />
          </Field>
          <Field label="Kezdés dátuma">
            <input
              type="date"
              className="input w-full"
              value={state.profile.startDate}
              onChange={(e) =>
                update((s) => ({ ...s, profile: { ...s.profile, startDate: e.target.value } }))
              }
            />
          </Field>
        </div>
      </section>

      <CloudSyncSection state={state} update={update} />

      <section className="card space-y-3">
        <h2 className="h2">Adatok mentése / visszaállítása</h2>
        <p className="text-sm text-muted">
          Az adataid a böngészőben tárolódnak (localStorage). Ha másik gépen is használni akarod, exportáld JSON-ba.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn-secondary"
            onClick={() => setExportData(exportState())}
          >
            📤 Export
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              try {
                importState(importData);
                setMsg("Adatok importálva!");
              } catch (e: any) {
                setMsg("Hiba az importálásnál: " + e.message);
              }
            }}
            disabled={!importData}
          >
            📥 Import
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm("Biztosan törlöd az összes adatot?")) {
                resetState();
                setMsg("Adatok törölve.");
              }
            }}
          >
            🗑️ Reset
          </button>
        </div>
        {exportData && (
          <textarea
            className="input w-full min-h-[150px] font-mono text-xs"
            readOnly
            value={exportData}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        )}
        <textarea
          className="input w-full min-h-[80px] font-mono text-xs"
          placeholder="Illeszd ide a JSON-t importáláshoz…"
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
        />
        {msg && <div className="text-sm text-accent2">{msg}</div>}
      </section>

      <section className="card text-xs text-muted">
        <p>v0.1 · Otthon Fit · Open source · Az adataid sosem hagyják el a gépedet (kivéve ha exportálod).</p>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function CloudSyncSection({ state, update }: { state: any; update: any }) {
  const code = useSyncCode();
  const [input, setInput] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInput(code ?? "");
  }, [code]);

  async function activate() {
    const c = input.trim();
    if (!/^[a-zA-Z0-9_-]{6,32}$/.test(c)) {
      setMsg("A sync kód 6–32 karakter, csak betűk/számok/-/_.");
      return;
    }
    setBusy(true);
    setMsg("");
    setSyncCode(c);
    // Megpróbálunk pull-olni — ha üres, push-olunk
    const r = await pullState(c);
    if (r.ok && r.data) {
      if (confirm("A felhőben már van adat ehhez a kódhoz. Felülírja a lokális adatokat?")) {
        update(() => (r.data as any).state);
        setMsg("✅ Felhőből letöltve.");
      } else {
        // Lokál győz: pusholjuk
        await pushState(c, state);
        setMsg("✅ Lokál állapot feltöltve.");
      }
    } else {
      const p = await pushState(c, state);
      setMsg(p.ok ? "✅ Sync aktiválva, állapot feltöltve." : "Hiba: " + (p.error || ""));
    }
    setBusy(false);
  }

  function generate() {
    const c = generateSyncCode();
    setInput(c);
  }

  function disconnect() {
    if (!confirm("Lecsatolod a felhőt? Az adatok lokálisan megmaradnak, de nem szinkronizálódnak.")) return;
    setSyncCode(null);
    setMsg("Sync kikapcsolva.");
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="h2">☁️ Cloud sync</h2>
        {code && <span className="tag !bg-accent2/20 !text-accent2 !border-accent2/40">aktív</span>}
      </div>
      <p className="text-sm text-muted">
        Adj meg egy <b>személyes sync kódot</b> (6–32 karakter). Másik eszközön
        ugyanezt a kódot beírva ugyanazt az adatot látod. Tartsd titokban — bárki aki ismeri, hozzáfér a fitneszadataidhoz.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input flex-1 min-w-[180px] font-mono"
          placeholder="pl. abc123def456"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {!code && (
          <button className="btn-secondary text-sm" onClick={generate} disabled={busy}>
            🎲 Generálj
          </button>
        )}
        {!code && (
          <button className="btn-primary text-sm" onClick={activate} disabled={busy}>
            {busy ? "Folyamatban…" : "Aktiválás"}
          </button>
        )}
        {code && (
          <>
            <button
              className="btn-secondary text-sm"
              onClick={async () => {
                setBusy(true);
                const p = await pushState(code, state);
                setMsg(p.ok ? "✅ Feltöltve." : "Hiba: " + (p.error || ""));
                setBusy(false);
              }}
              disabled={busy}
            >
              ↑ Feltöltés
            </button>
            <button
              className="btn-secondary text-sm"
              onClick={async () => {
                setBusy(true);
                const r = await pullState(code);
                if (r.ok && r.data) {
                  if (confirm("Felülírja a lokális adatokat a felhőbeli verzióval?")) {
                    update(() => (r.data as any).state);
                    setMsg("✅ Letöltve.");
                  }
                } else {
                  setMsg("Hiba vagy üres: " + (r.error || "nincs adat"));
                }
                setBusy(false);
              }}
              disabled={busy}
            >
              ↓ Letöltés
            </button>
            <button className="btn-danger text-sm" onClick={disconnect}>
              Lecsatlakozás
            </button>
          </>
        )}
      </div>
      {code && (
        <div className="text-xs text-muted">
          Aktív kód: <code className="bg-panel2 px-1 rounded text-accent2">{code}</code> ·
          minden változás után 3 mp-re automatikusan szinkronizál.
        </div>
      )}
      {msg && <div className="text-sm text-accent2">{msg}</div>}
      <details className="text-xs text-muted">
        <summary className="cursor-pointer">Mit kell tennem hogy működjön a felhő?</summary>
        <div className="mt-2 space-y-1">
          <p>1. A Vercel projektedhez kapcsolj egy KV (Redis) adatbázist: Dashboard → fitness projekt → Storage → Create → KV.</p>
          <p>2. Connect to project. Az env változók automatikusan beállítódnak (KV_REST_API_URL, KV_REST_API_TOKEN).</p>
          <p>3. Redeploy (vagy várj a következő pushra).</p>
          <p>4. Generálj egy sync kódot fent, és aktiváld. Másik eszközön ugyanezt írd be.</p>
        </div>
      </details>
    </section>
  );
}
