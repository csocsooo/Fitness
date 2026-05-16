"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeCurrentWeek, todayISO, useAppState, type WeightEntry } from "@/lib/store";
import { getWeek, targetWeightForWeek } from "@/lib/program";
import SessionCard from "@/components/SessionCard";
import WeightChart from "@/components/WeightChart";

export default function Home() {
  const { state, ready, update } = useAppState();
  const [weightInput, setWeightInput] = useState<string>("");

  const week = useMemo(() => {
    const w = ready ? computeCurrentWeek(state.profile) : 1;
    return getWeek(w)!;
  }, [ready, state.profile]);

  const today = todayISO();
  const targetThisWeek = targetWeightForWeek(week.index, state.profile.startWeightKg, state.profile.goalWeightKg);
  const latestWeight: WeightEntry | undefined = useMemo(() => {
    return [...state.weights].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [state.weights]);

  useEffect(() => {
    if (latestWeight) setWeightInput(String(latestWeight.kg));
  }, [latestWeight?.kg]);

  function saveWeight() {
    const kg = parseFloat(weightInput.replace(",", "."));
    if (Number.isNaN(kg) || kg < 30 || kg > 250) return;
    update((s) => {
      const others = s.weights.filter((w) => w.date !== today);
      return { ...s, weights: [...others, { date: today, kg }] };
    });
  }

  const completedThisWeek = state.completed[`w${week.index}`];

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="h1">Szia, {state.profile.name}! 👋</h1>
            <p className="text-muted">
              {week.phaseName} · {week.index}. hét / 26
            </p>
          </div>
          <Link href="/beallitasok" className="btn-secondary text-sm">
            ⚙️ Profil
          </Link>
        </div>
      </header>

      {/* Súly összegzés */}
      <section className="card">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="label">Jelenlegi súly</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {latestWeight ? latestWeight.kg : state.profile.startWeightKg}
              </span>
              <span className="text-muted">kg</span>
            </div>
            <div className="text-xs text-muted mt-1">
              Heti cél: <span className="text-accent">{targetThisWeek} kg</span> ·
              Végcél: <span className="text-accent2">{state.profile.goalWeightKg} kg</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="label">Mai súly (kg)</label>
              <input
                type="text"
                inputMode="decimal"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="input w-28"
                placeholder="pl. 88.4"
              />
            </div>
            <button className="btn-primary" onClick={saveWeight}>Mentés</button>
          </div>
        </div>
        <div className="mt-4">
          <WeightChart
            data={state.weights}
            start={state.profile.startWeightKg}
            goal={state.profile.goalWeightKg}
            startDate={state.profile.startDate}
          />
        </div>
      </section>

      {/* Heti téma */}
      <section className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="h2">Heti fókusz</h2>
            <p className="text-muted">{week.theme}</p>
          </div>
          <Link href="/program" className="btn-secondary text-sm">Teljes program →</Link>
        </div>
        <div className="text-xs text-muted mt-2">{week.cardio}</div>
      </section>

      {/* Mai / heti edzések */}
      <section>
        <h2 className="h2 mb-3">Ez a heti edzések</h2>
        <p className="text-xs text-muted mb-3">
          Tipp: a jobb felső <span className="text-accent">✓</span> gombbal manuálisan is megjelölheted készként.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {week.sessions.map((s) => {
            const doneDate = (state.completed as any)[`w${week.index}-${s.id}`];
            return (
              <SessionCard
                key={s.id}
                weekIndex={week.index}
                session={s}
                done={!!doneDate}
                doneDate={doneDate || undefined}
              />
            );
          })}
        </div>
      </section>

      {/* Gyors tippek */}
      <section className="card">
        <h2 className="h2 mb-2">💡 Mai mikro-tippek (ülőmunkához)</h2>
        <ul className="list-disc pl-5 text-sm text-white/85 space-y-1">
          <li>Minden 2. órában: 5 perc séta + 10 guggolás + 10 csípőemelés.</li>
          <li>Tölts egy nagy üveg vizet, és idd ki délig — utána tölts újra.</li>
          <li>Este 21:00 után már ne nézz képernyőre étellel — segít az alvásnak és a fogyásnak.</li>
          <li>Az alkohol és a sör pont a hasi zsírt etetik. Hétvégén max 1-2 alkalom.</li>
        </ul>
      </section>
    </div>
  );
}
