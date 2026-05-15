"use client";

import { useState } from "react";
import { useAppState, exportState, importState, resetState } from "@/lib/store";

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
