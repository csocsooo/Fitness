"use client";

import { useMemo, useState } from "react";
import { EXERCISES, type Muscle } from "@/lib/exercises";

const MUSCLES: { id: Muscle; label: string }[] = [
  { id: "mell", label: "Mell" },
  { id: "hát", label: "Hát" },
  { id: "váll", label: "Váll" },
  { id: "kar", label: "Kar" },
  { id: "láb", label: "Láb" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "mobilitás", label: "Mobilitás" },
];

export default function Exercises() {
  const [filter, setFilter] = useState<Muscle | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return EXERCISES.filter(
      (e) =>
        (filter === "all" || e.muscles.includes(filter)) &&
        (q === "" || e.name.toLowerCase().includes(q.toLowerCase()))
    );
  }, [filter, q]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h1">Gyakorlatok</h1>
        <p className="text-muted">{EXERCISES.length} mozgás — push-up bar + kanapé.</p>
      </header>

      <div className="flex gap-2 flex-wrap items-center">
        <input
          className="input flex-1 min-w-[150px]"
          placeholder="Keresés..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => setFilter("all")}
          className={"px-3 py-1.5 rounded-full text-sm border " + (filter === "all" ? "bg-accent text-black border-accent" : "border-line text-white/70 hover:bg-panel2")}
        >
          Mind
        </button>
        {MUSCLES.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilter(m.id)}
            className={"px-3 py-1.5 rounded-full text-sm border " + (filter === m.id ? "bg-accent text-black border-accent" : "border-line text-white/70 hover:bg-panel2")}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((e) => (
          <div key={e.id} className="card">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="h3">{e.name}</h3>
              <div className="flex gap-1">
                <span className="tag">L{e.level}</span>
                {e.muscles.slice(0, 2).map((m) => (
                  <span key={m} className="tag">{m}</span>
                ))}
              </div>
            </div>
            <p className="text-sm text-white/85 mt-2">{e.desc}</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/75 space-y-0.5">
              {e.cues.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            {(e.regression || e.progression) && (
              <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs">
                {e.regression && (
                  <div className="bg-panel2 rounded-md p-2 border border-line">
                    <span className="text-warn font-semibold">Könnyítés:</span> {e.regression}
                  </div>
                )}
                {e.progression && (
                  <div className="bg-panel2 rounded-md p-2 border border-line">
                    <span className="text-accent2 font-semibold">Nehezítés:</span> {e.progression}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
