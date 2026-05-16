"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PROGRAM, getWeek, type SetSpec, type WorkoutBlock } from "@/lib/program";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { getAnimId } from "@/lib/animations";
import ExerciseAnimation from "@/components/ExerciseAnimation";
import { computeCurrentWeek, todayISO, useAppState, type SetLog, type WorkoutLog } from "@/lib/store";

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const ref = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setLeft(seconds);
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          if (ref.current) clearInterval(ref.current);
          onDone();
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [seconds]);
  return (
    <div className="card !bg-panel2 flex items-center justify-between">
      <div>
        <div className="text-xs text-muted">Pihenő</div>
        <div className="text-2xl font-bold text-accent">{fmtTime(left)}</div>
      </div>
      <button className="btn-secondary text-sm" onClick={() => { setLeft(0); onDone(); }}>
        Skip
      </button>
    </div>
  );
}

function DurationTimer({ seconds, onDone }: { seconds: number; onDone: (elapsed: number) => void }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            if (ref.current) clearInterval(ref.current);
            setRunning(false);
            onDone(seconds);
            return 0;
          }
          return l - 1;
        });
      }, 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, seconds]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold tabular-nums">{fmtTime(left)}</span>
      {!running ? (
        <button className="btn-primary text-sm" onClick={() => setRunning(true)}>Indítás</button>
      ) : (
        <button className="btn-secondary text-sm" onClick={() => setRunning(false)}>Szünet</button>
      )}
      <button className="btn-ghost text-sm" onClick={() => { setLeft(seconds); setRunning(false); }}>
        ↺
      </button>
    </div>
  );
}

function ItemRow({
  item,
  blockIndex,
  itemIndex,
  log,
  onLog,
}: {
  item: SetSpec;
  blockIndex: number;
  itemIndex: number;
  log: SetLog[];
  onLog: (set: SetLog) => void;
}) {
  const ex = getExercise(item.exerciseId);
  const [expanded, setExpanded] = useState(false);
  const [restingFor, setRestingFor] = useState<number | null>(null);

  if (!ex) return null;
  const slotPrefix = `${blockIndex}-${itemIndex}-`;
  const setsDone = log.filter((s) => s.slotId?.startsWith(slotPrefix) && s.done).length;
  const allDone = setsDone >= item.sets;

  return (
    <div className={"card !p-3 transition " + (allDone ? "border-accent2/40" : "")}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-start gap-2">
          <div className="text-xl">{allDone ? "✅" : "🔘"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{ex.name}</span>
              <span className="tag">
                {item.sets} × {item.reps ? `${item.reps} ism` : item.durationSec ? `${item.durationSec}s` : "—"}
              </span>
              <span className="tag">pihi {item.restSec}s</span>
              <span className="tag">{setsDone}/{item.sets}</span>
            </div>
            {item.note && <div className="text-xs text-muted mt-0.5">{item.note}</div>}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <ExerciseAnimation dbId={getAnimId(ex.id)} size="md" />
          <div className="text-sm text-white/85">{ex.desc}</div>
          <ul className="text-sm list-disc pl-5 text-white/80 space-y-0.5">
            {ex.cues.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          {(ex.regression || ex.progression) && (
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {ex.regression && (
                <div className="bg-panel2 rounded-md p-2 border border-line">
                  <span className="text-warn font-semibold">Könnyítés:</span> {ex.regression}
                </div>
              )}
              {ex.progression && (
                <div className="bg-panel2 rounded-md p-2 border border-line">
                  <span className="text-accent2 font-semibold">Nehezítés:</span> {ex.progression}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2">
            {Array.from({ length: item.sets }).map((_, sIdx) => {
              const slotId = `${blockIndex}-${itemIndex}-${sIdx}`;
              const existing = log.find((l) => l.slotId === slotId);
              return (
                <SetRow
                  key={sIdx}
                  item={item}
                  setIndex={sIdx}
                  existing={existing}
                  unit={ex.unit}
                  onComplete={(payload) => {
                    onLog({
                      exerciseId: item.exerciseId,
                      setIndex: sIdx,
                      slotId,
                      reps: payload.reps,
                      durationSec: payload.durationSec,
                      rpe: payload.rpe,
                      done: true,
                    });
                    setRestingFor(item.restSec);
                  }}
                />
              );
            })}
          </div>

          {restingFor !== null && (
            <RestTimer seconds={restingFor} onDone={() => setRestingFor(null)} />
          )}
        </div>
      )}
    </div>
  );
}

function SetRow({
  item,
  setIndex,
  existing,
  unit,
  onComplete,
}: {
  item: SetSpec;
  setIndex: number;
  existing?: SetLog;
  unit: string;
  onComplete: (p: { reps?: number; durationSec?: number; rpe?: number }) => void;
}) {
  const isDuration = !!item.durationSec;
  const [reps, setReps] = useState<string>(existing?.reps?.toString() ?? (item.reps?.toString() ?? ""));
  const [rpe, setRpe] = useState<string>(existing?.rpe?.toString() ?? "");
  const done = !!existing?.done;

  return (
    <div className={"flex items-center gap-2 flex-wrap rounded-md p-2 " + (done ? "bg-accent2/10 border border-accent2/30" : "bg-panel2 border border-line")}>
      <span className="text-xs text-muted w-16">#{setIndex + 1}. szett</span>
      {isDuration ? (
        <DurationTimer
          seconds={item.durationSec!}
          onDone={(elapsed) => onComplete({ durationSec: elapsed })}
        />
      ) : (
        <>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="input w-20"
            placeholder={`${item.reps ?? 0} ism`}
          />
          <span className="text-xs text-muted">{unit}</span>
          <span className="text-xs text-muted ml-2">RPE</span>
          <select
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="input !py-1"
          >
            <option value="">–</option>
            {[5, 6, 7, 8, 9, 10].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <button
            className={done ? "btn-secondary text-sm" : "btn-primary text-sm"}
            onClick={() =>
              onComplete({
                reps: parseInt(reps) || item.reps,
                rpe: rpe ? parseInt(rpe) : undefined,
              })
            }
          >
            {done ? "Módosít" : "Kész"}
          </button>
        </>
      )}
      {done && !isDuration && <span className="text-accent2 text-xs">✓ mentve</span>}
    </div>
  );
}

function WorkoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, ready, update } = useAppState();

  const currentWeek = ready ? computeCurrentWeek(state.profile) : 1;
  const wIdx = parseInt(params.get("w") || String(currentWeek)) || currentWeek;
  const week = getWeek(wIdx) ?? PROGRAM[0];
  const sIdParam = params.get("s");
  const session = useMemo(
    () => (sIdParam ? week.sessions.find((s) => s.id === sIdParam) : week.sessions[0]) ?? week.sessions[0],
    [week, sIdParam]
  );

  const logKey = `${session.id}-${todayISO()}`;
  const existingLog = state.workouts.find((w) => w.id === logKey);
  const [sets, setSets] = useState<SetLog[]>(existingLog?.sets ?? []);
  const [feeling, setFeeling] = useState<number | "">(existingLog?.feeling ?? "");
  const [notes, setNotes] = useState<string>(existingLog?.notes ?? "");
  const [startedAt] = useState<number>(Date.now());

  useEffect(() => {
    setSets(existingLog?.sets ?? []);
    setFeeling(existingLog?.feeling ?? "");
    setNotes(existingLog?.notes ?? "");
  }, [logKey]);

  function upsertSet(newSet: SetLog) {
    setSets((prev) => {
      const others = prev.filter((s) => s.slotId !== newSet.slotId);
      const next = [...others, newSet];
      saveWorkout(next, feeling === "" ? undefined : (feeling as 1|2|3|4|5), notes);
      return next;
    });
  }

  function saveWorkout(setsX: SetLog[], feelingX?: 1|2|3|4|5, notesX?: string) {
    const log: WorkoutLog = {
      id: logKey,
      weekIndex: wIdx,
      sessionId: session.id,
      date: todayISO(),
      sets: setsX,
      durationMin: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      feeling: feelingX,
      notes: notesX,
    };
    update((s) => {
      const others = s.workouts.filter((w) => w.id !== logKey);
      const completed = { ...s.completed };
      const totalSets = session.blocks.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.sets, 0), 0);
      const doneSets = setsX.filter((x) => x.done && x.slotId).length;
      // Kész jelölés ha: minden szett pipálva, VAGY feeling kitöltve és van legalább 1 szett,
      // VAGY az edzés legalább 12 percig tartott.
      const isComplete =
        (doneSets >= totalSets) ||
        (feelingX !== undefined && doneSets >= 1) ||
        (log.durationMin !== undefined && log.durationMin >= 12 && doneSets >= 1);
      if (isComplete) {
        completed[`w${wIdx}-${session.id}`] = log.date;
        completed[`w${wIdx}`] = log.date;
      }
      return { ...s, workouts: [...others, log], completed };
    });
  }

  function resetSession() {
    if (!confirm("Biztosan törlöd a mai edzés szett-jelölőit? A bevitt értékek elvesznek.")) return;
    setSets([]);
    setFeeling("");
    setNotes("");
    update((s) => ({
      ...s,
      workouts: s.workouts.filter((w) => w.id !== logKey),
      completed: Object.fromEntries(
        Object.entries(s.completed).filter(
          ([k]) => k !== `w${wIdx}-${session.id}` && k !== `w${wIdx}`
        )
      ),
    }));
  }

  const totalSets = session.blocks.reduce((acc, b) => acc + b.items.reduce((a, i) => a + i.sets, 0), 0);
  const doneSets = sets.filter((s) => s.done && s.slotId).length;
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/program" className="text-xs text-muted hover:text-white">← Program</Link>
          <h1 className="h1">{session.name}</h1>
          <p className="text-muted">{week.index}. hét · {session.focus}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Haladás</div>
          <div className="text-2xl font-bold text-accent2">{pct}%</div>
          <div className="text-xs text-muted">{doneSets}/{totalSets} szett</div>
        </div>
      </header>

      {/* Hét napjai */}
      <div className="flex gap-2 flex-wrap text-xs">
        {week.sessions.map((s) => (
          <Link
            key={s.id}
            href={`/edzes?w=${wIdx}&s=${s.id}`}
            className={
              "px-3 py-1 rounded-full border transition " +
              (s.id === session.id
                ? "bg-accent text-black border-accent"
                : "border-line text-white/70 hover:text-white hover:bg-panel2")
            }
          >
            {s.name}
          </Link>
        ))}
      </div>

      {session.blocks.map((block, bi) => (
        <BlockView key={bi} block={block} blockIndex={bi} sets={sets} onLog={upsertSet} />
      ))}

      <section className="card space-y-3">
        <h3 className="h3">Hogy érezted magad?</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => { setFeeling(v as any); saveWorkout(sets, v as any, notes); }}
              className={
                "w-10 h-10 rounded-lg border text-lg " +
                (feeling === v
                  ? "bg-accent text-black border-accent"
                  : "bg-panel2 border-line hover:bg-line")
              }
              title={["szar","gyenge","közepes","jó","szuper"][v-1]}
            >
              {["😩","😕","🙂","😎","🔥"][v-1]}
            </button>
          ))}
        </div>
        <div>
          <label className="label">Jegyzet (opcionális)</label>
          <textarea
            className="input w-full min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => saveWorkout(sets, feeling === "" ? undefined : (feeling as any), notes)}
            placeholder="pl. a couch row nehéz volt, jövőre több pihenő..."
          />
        </div>
      </section>

      <div className="flex gap-2 flex-wrap">
        <button
          className="btn-primary"
          onClick={() => {
            saveWorkout(sets, feeling === "" ? undefined : (feeling as any), notes);
            router.push("/");
          }}
        >
          Edzés mentése
        </button>
        <button
          className="btn-secondary !bg-accent2/20 !border-accent2/50 text-accent2 hover:!bg-accent2/30"
          onClick={() => {
            // Manuális: jelöld késznek függetlenül a százaléktól
            update((s) => {
              const completed = { ...s.completed };
              completed[`w${wIdx}-${session.id}`] = todayISO();
              completed[`w${wIdx}`] = todayISO();
              return { ...s, completed };
            });
            saveWorkout(sets, feeling === "" ? undefined : (feeling as any), notes);
            router.push("/");
          }}
          title="Megjelöld késznek függetlenül a százaléktól"
        >
          ✅ Befejezve
        </button>
        <Link href="/" className="btn-ghost">Vissza</Link>
        <button className="btn-ghost text-danger ml-auto" onClick={resetSession}>
          ↺ Újrakezdés
        </button>
      </div>
    </div>
  );
}

function BlockView({
  block,
  blockIndex,
  sets,
  onLog,
}: {
  block: WorkoutBlock;
  blockIndex: number;
  sets: SetLog[];
  onLog: (s: SetLog) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="h2 mt-2">{block.title}</h2>
      <div className="grid gap-2">
        {block.items.map((it, i) => (
          <ItemRow key={i} item={it} blockIndex={blockIndex} itemIndex={i} log={sets} onLog={onLog} />
        ))}
      </div>
    </section>
  );
}

export default function EdzesPage() {
  return (
    <Suspense fallback={<div className="text-muted">Betöltés…</div>}>
      <WorkoutInner />
    </Suspense>
  );
}
