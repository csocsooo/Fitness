"use client";

import { useMemo, useState } from "react";
import type { WorkoutLog } from "@/lib/store";

const MONTHS = ["Január","Február","Március","Április","Május","Június","Július","Augusztus","Szeptember","Október","November","December"];
const DAYS = ["H","K","Sz","Cs","P","Szo","V"];

type DayStatus = "future" | "rest" | "missed" | "done" | "partial" | "today";

type Props = {
  workouts: WorkoutLog[];
  startDate: string;       // ISO yyyy-mm-dd — a program kezdete
  programDays: number;     // pl. 26*7 = 182
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s: string) {
  return new Date(s + "T00:00:00");
}

export default function Calendar({ workouts, startDate, programDays }: Props) {
  const start = parseISO(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + programDays - 1);
  const todayStr = ymd(new Date());

  // Workout -> nap mapping: dátum -> teljesítettség (kész vagy részleges)
  const byDay = useMemo(() => {
    const map = new Map<string, { done: number; partial: number }>();
    for (const w of workouts) {
      const totalDone = w.sets.filter((s) => s.done && s.slotId).length;
      if (totalDone === 0) continue;
      // teljes session-nek tekintjük, ha a workout 90% felett van — de itt csak edzésnap megléte számít
      const cur = map.get(w.date) ?? { done: 0, partial: 0 };
      // Ha a feeling ki van töltve VAGY hosszabb mint 15 perc → "done"
      const isDone = !!w.feeling || (w.durationMin ?? 0) >= 15;
      if (isDone) cur.done++;
      else cur.partial++;
      map.set(w.date, cur);
    }
    return map;
  }, [workouts]);

  // Kezdő hónap = startDate hónapja, alapból az aktuális hónapra ugorjon
  const initialMonth = useMemo(() => {
    const t = new Date();
    if (t < start) return new Date(start.getFullYear(), start.getMonth(), 1);
    if (t > end) return new Date(end.getFullYear(), end.getMonth(), 1);
    return new Date(t.getFullYear(), t.getMonth(), 1);
  }, [startDate, programDays]);

  const [cursor, setCursor] = useState<Date>(initialMonth);
  const yr = cursor.getFullYear();
  const mo = cursor.getMonth();

  function shift(delta: number) {
    setCursor(new Date(yr, mo + delta, 1));
  }

  // Naptár grid építés
  const firstOfMonth = new Date(yr, mo, 1);
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  // Hétfő-kezdetű grid: ISO weekday (1=Mon..7=Sun); JS getDay() (0=Sun..6=Sat)
  const leading = (firstOfMonth.getDay() + 6) % 7; // 0=hétfő

  const cells: { date: string; status: DayStatus; inMonth: boolean }[] = [];
  // előző hónap végéből kitölt
  for (let i = leading; i > 0; i--) {
    const d = new Date(yr, mo, 1 - i);
    cells.push({ date: ymd(d), status: cellStatus(d), inMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(yr, mo, i);
    cells.push({ date: ymd(d), status: cellStatus(d), inMonth: true });
  }
  // következő hónap eleje, hogy 6 sor legyen
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = parseISO(cells[cells.length - 1].date);
    last.setDate(last.getDate() + 1);
    cells.push({ date: ymd(last), status: cellStatus(last), inMonth: false });
    if (cells.length >= 42) break;
  }

  function cellStatus(d: Date): DayStatus {
    const s = ymd(d);
    if (s === todayStr) {
      // Ha ma van valami logged — done/partial színt is alkalmazzuk
      const e = byDay.get(s);
      if (e) return e.done > 0 ? "done" : "partial";
      return "today";
    }
    if (d < start || d > end) return "future"; // program-on kívüli
    if (d > new Date()) return "future";
    const e = byDay.get(s);
    if (e) return e.done > 0 ? "done" : "partial";
    // Pihenőnap-e? A program 6 napos hétben: napi sablon szerint
    // 0=H,1=K,2=Sz,3=Cs,4=P,5=Szo,6=V — V általában pihi
    const dow = (d.getDay() + 6) % 7;
    if (dow === 6) return "rest"; // vasárnap pihenő alapból
    return "missed";
  }

  // Stat
  const stat = useMemo(() => {
    let done = 0, partial = 0, missed = 0;
    for (const [date, v] of byDay.entries()) {
      if (v.done > 0) done++; else if (v.partial > 0) partial++;
    }
    // missed: a startDate és tegnap között azok a napok, amelyek nem pihenőnapok és nincs log
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let d = new Date(start); d < today; d.setDate(d.getDate() + 1)) {
      if (d > end) break;
      const s = ymd(d);
      if (byDay.has(s)) continue;
      const dow = (d.getDay() + 6) % 7;
      if (dow === 6) continue;
      missed++;
    }
    return { done, partial, missed };
  }, [byDay, startDate]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="btn-ghost !p-1.5">‹</button>
          <h2 className="h2">{yr}. {MONTHS[mo]}</h2>
          <button onClick={() => shift(1)} className="btn-ghost !p-1.5">›</button>
        </div>
        <div className="flex gap-2 text-xs">
          <Legend color="bg-accent2" label="edzés" />
          <Legend color="bg-warn" label="részleges" />
          <Legend color="bg-danger/70" label="kihagyott" />
          <Legend color="bg-panel2 border border-line" label="pihi" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-1">
        {DAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div
            key={i}
            title={c.date}
            className={
              "aspect-square rounded-md text-xs flex items-center justify-center " +
              (!c.inMonth ? "opacity-30 " : "") +
              statusClass(c.status, c.date === todayStr)
            }
          >
            {parseISO(c.date).getDate()}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <SmallStat label="Edzések" value={stat.done} accent="accent2" />
        <SmallStat label="Részleges" value={stat.partial} accent="warn" />
        <SmallStat label="Kihagyott" value={stat.missed} accent="danger" />
      </div>
    </div>
  );
}

function statusClass(s: DayStatus, isToday: boolean) {
  const ring = isToday ? "ring-2 ring-accent " : "";
  switch (s) {
    case "done": return ring + "bg-accent2 text-black font-semibold";
    case "partial": return ring + "bg-warn text-black font-semibold";
    case "missed": return ring + "bg-danger/70 text-white";
    case "rest": return ring + "bg-panel2 border border-line text-muted";
    case "today": return ring + "bg-accent/20 text-white font-semibold";
    case "future": return "bg-panel2/40 text-muted/60";
  }
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={"inline-block w-3 h-3 rounded " + color} />
      <span className="text-muted">{label}</span>
    </span>
  );
}

function SmallStat({ label, value, accent }: { label: string; value: number; accent: "accent2" | "warn" | "danger" }) {
  const color = accent === "accent2" ? "text-accent2" : accent === "warn" ? "text-warn" : "text-danger";
  return (
    <div className="bg-panel2 border border-line rounded-md p-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={"text-xl font-bold " + color}>{value}</div>
    </div>
  );
}
