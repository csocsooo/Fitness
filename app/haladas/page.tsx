"use client";

import { useMemo } from "react";
import { useAppState, computeCurrentWeek } from "@/lib/store";
import { PROGRAM, targetWeightForWeek } from "@/lib/program";
import { EXERCISES, getExercise } from "@/lib/exercises";
import WeightChart from "@/components/WeightChart";
import Calendar from "@/components/Calendar";

export default function Haladas() {
  const { state, ready } = useAppState();

  const currentWeek = ready ? computeCurrentWeek(state.profile) : 1;
  const target = targetWeightForWeek(currentWeek, state.profile.startWeightKg, state.profile.goalWeightKg);
  const latest = useMemo(
    () => [...state.weights].sort((a, b) => b.date.localeCompare(a.date))[0],
    [state.weights]
  );
  const startKg = state.profile.startWeightKg;
  const currentKg = latest?.kg ?? startKg;
  const lost = +(startKg - currentKg).toFixed(1);
  const goalLost = startKg - state.profile.goalWeightKg;
  const pct = Math.max(0, Math.min(100, Math.round((lost / goalLost) * 100)));

  // Edzések statisztika
  const totalWorkouts = state.workouts.length;
  const totalMin = state.workouts.reduce((a, w) => a + (w.durationMin ?? 0), 0);
  const completedSessions = Object.keys(state.completed).filter((k) => k.includes("-")).length;

  // PR-ek gyakorlatonként
  const prByExercise = useMemo(() => {
    const map = new Map<string, { reps?: number; durationSec?: number; date: string }>();
    for (const w of state.workouts) {
      for (const s of w.sets) {
        if (!s.done) continue;
        const cur = map.get(s.exerciseId);
        if (s.reps !== undefined) {
          if (!cur || (cur.reps ?? 0) < s.reps) map.set(s.exerciseId, { reps: s.reps, date: w.date });
        } else if (s.durationSec !== undefined) {
          if (!cur || (cur.durationSec ?? 0) < s.durationSec) map.set(s.exerciseId, { durationSec: s.durationSec, date: w.date });
        }
      }
    }
    return map;
  }, [state.workouts]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">Haladás</h1>
        <p className="text-muted">Számok, görbék, PR-ek.</p>
      </header>

      <section className="grid sm:grid-cols-4 gap-3">
        <Stat label="Heti pozíció" value={`${currentWeek} / 26`} hint={`${Math.round((currentWeek / 26) * 100)}% kész`} />
        <Stat label="Leadott súly" value={`${lost} kg`} hint={`Cél: ${goalLost.toFixed(1)} kg`} accent="accent2" />
        <Stat label="Befejezve edzés" value={`${totalWorkouts}`} hint={`${Math.round(totalMin)} perc`} />
        <Stat label="Cél tartás" value={`${currentKg <= target ? "🟢" : "🟠"}`} hint={`Heti cél ${target} kg`} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h2">Súlyveszteség</h2>
          <div className="text-sm text-muted">{pct}% a cél felé</div>
        </div>
        <div className="w-full h-2 bg-panel2 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-accent2" style={{ width: `${pct}%` }} />
        </div>
        <WeightChart
          data={state.weights}
          start={state.profile.startWeightKg}
          goal={state.profile.goalWeightKg}
          startDate={state.profile.startDate}
        />
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Személyi rekordok (PR)</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[...prByExercise.entries()].map(([id, pr]) => {
            const ex = getExercise(id);
            if (!ex) return null;
            return (
              <div key={id} className="flex items-center justify-between bg-panel2 rounded-md px-3 py-2 border border-line">
                <span>{ex.name}</span>
                <span className="text-accent2 font-semibold">
                  {pr.reps ? `${pr.reps} ism.` : pr.durationSec ? `${pr.durationSec} mp` : "–"}
                </span>
              </div>
            );
          })}
          {prByExercise.size === 0 && (
            <p className="text-muted">Még nincs adat. Csinálj egy edzést, és itt megjelennek a rekordjaid.</p>
          )}
        </div>
      </section>

      <Calendar
        workouts={state.workouts}
        startDate={state.profile.startDate}
        programDays={26 * 7}
      />

      <section className="card">
        <h2 className="h2 mb-3">Hetek áttekintés</h2>
        <div className="grid grid-cols-6 sm:grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
          {PROGRAM.map((w) => {
            const done = !!state.completed[`w${w.index}`];
            const isNow = w.index === currentWeek;
            return (
              <div
                key={w.index}
                title={`${w.index}. hét`}
                className={
                  "aspect-square rounded-md flex items-center justify-center text-xs " +
                  (done ? "bg-accent2 text-black font-semibold" :
                   isNow ? "bg-accent text-black font-semibold" :
                   "bg-panel2 border border-line text-muted")
                }
              >
                {w.index}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: "accent" | "accent2" }) {
  return (
    <div className="card">
      <div className="text-xs text-muted">{label}</div>
      <div className={"text-2xl font-bold mt-1 " + (accent === "accent2" ? "text-accent2" : accent === "accent" ? "text-accent" : "")}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
