"use client";

import { useState } from "react";
import { useAppState, todayISO } from "@/lib/store";

export default function Naplo() {
  const { state, ready, update } = useAppState();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | "">("");
  const [energy, setEnergy] = useState<number | "">("");
  const [sleep, setSleep] = useState<string>("");

  function save() {
    if (!text.trim() && mood === "" && energy === "" && !sleep) return;
    update((s) => ({
      ...s,
      journal: [
        {
          id: `j-${Date.now()}`,
          date: todayISO(),
          text: text.trim(),
          mood: mood === "" ? undefined : (mood as any),
          energy: energy === "" ? undefined : (energy as any),
          sleep: sleep ? parseFloat(sleep.replace(",", ".")) : undefined,
        },
        ...s.journal,
      ],
    }));
    setText(""); setMood(""); setEnergy(""); setSleep("");
  }

  function remove(id: string) {
    update((s) => ({ ...s, journal: s.journal.filter((j) => j.id !== id) }));
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">Napló</h1>
        <p className="text-muted">Hangulat, energia, alvás, gondolatok. Bármit ide írhatsz — emlékezni fog rá.</p>
      </header>

      <section className="card space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Hangulat</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setMood(v)}
                  className={"w-9 h-9 rounded-md border " + (mood === v ? "bg-accent text-black border-accent" : "bg-panel2 border-line")}
                >
                  {["😩","😕","🙂","😎","🤩"][v-1]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Energia</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setEnergy(v)}
                  className={"w-9 h-9 rounded-md border " + (energy === v ? "bg-accent text-black border-accent" : "bg-panel2 border-line")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Alvás (óra)</label>
            <input
              type="text"
              inputMode="decimal"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="input w-28"
              placeholder="pl. 7.5"
            />
          </div>
        </div>
        <textarea
          className="input w-full min-h-[100px]"
          placeholder="Mit érzel, mi ment jól, mi nem… (pl. 'ma a couch row sokkal könnyebbnek tűnt')"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={save} className="btn-primary">Bejegyzés mentése</button>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Korábbi bejegyzések</h2>
        {state.journal.length === 0 && <p className="text-muted">Még nincs bejegyzés.</p>}
        {state.journal.map((j) => (
          <div key={j.id} className="card">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">{j.date}</div>
              <button onClick={() => remove(j.id)} className="text-xs text-muted hover:text-danger">törlés</button>
            </div>
            <div className="text-xs text-muted mt-1 flex gap-3">
              {j.mood && <span>Hangulat: {["😩","😕","🙂","😎","🤩"][j.mood-1]}</span>}
              {j.energy && <span>Energia: {j.energy}/5</span>}
              {j.sleep && <span>Alvás: {j.sleep} óra</span>}
            </div>
            {j.text && <p className="mt-2 whitespace-pre-wrap">{j.text}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
