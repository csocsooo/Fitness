"use client";

import Link from "next/link";
import { PROGRAM, targetWeightForWeek } from "@/lib/program";
import { useAppState, computeCurrentWeek } from "@/lib/store";
import { useMemo } from "react";

export default function ProgramPage() {
  const { state, ready } = useAppState();
  const currentWeek = ready ? computeCurrentWeek(state.profile) : 1;

  const phases = useMemo(() => {
    const map = new Map<string, typeof PROGRAM>();
    for (const w of PROGRAM) {
      if (!map.has(w.phaseName)) map.set(w.phaseName, [] as any);
      map.get(w.phaseName)!.push(w);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">6 hónapos terv</h1>
        <p className="text-muted">
          26 hét. 4 fázis. Heti 4–5 edzés + napi séta + 1 mobilitás nap.
        </p>
      </header>

      <section className="card text-sm space-y-2">
        <p><b className="text-accent">Hogy működik?</b> A program automatikusan halad veled — a kezdési dátum alapján mindig az aktuális hetet mutatjuk a kezdőlapon.</p>
        <p><b className="text-accent">Eszközigény:</b> 1 pár pushup bar + 1 stabil kanapé. Ennyi.</p>
        <p><b className="text-accent">Fogyási cél:</b> heti ~0,5–0,6 kg, 6 hónap alatt 89 → 75 kg. Nem gyorsabban, mert akkor izmot is veszítenél.</p>
      </section>

      {phases.map(([name, weeks]) => (
        <section key={name} className="space-y-3">
          <h2 className="h2">{name}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {weeks.map((w) => {
              const isCurrent = w.index === currentWeek;
              const isPast = w.index < currentWeek;
              return (
                <div
                  key={w.index}
                  className={
                    "card transition " +
                    (isCurrent ? "border-accent ring-1 ring-accent/40" : isPast ? "opacity-70" : "")
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted">{w.index}. hét</div>
                      <div className="font-semibold">{w.theme}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-muted">Súlycél</div>
                      <div className="text-accent font-bold">
                        {targetWeightForWeek(w.index, state.profile.startWeightKg, state.profile.goalWeightKg)} kg
                      </div>
                    </div>
                  </div>
                  <ul className="mt-3 text-sm space-y-1">
                    {w.sessions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <Link
                          href={`/edzes?w=${w.index}&s=${s.id}`}
                          className="text-white/85 hover:text-accent"
                        >
                          · {s.name}
                        </Link>
                        <span className="tag">{s.estMinutes}p</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
