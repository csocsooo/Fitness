"use client";

import { useEffect, useState, useCallback } from "react";

// ===== TYPES =====

export type Profile = {
  name: string;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  startDate: string; // ISO yyyy-mm-dd
};

export type WeightEntry = {
  date: string;   // ISO yyyy-mm-dd
  kg: number;
  note?: string;
};

export type SetLog = {
  exerciseId: string;
  setIndex: number;
  // Egyedi slot-azonosító: "blockIdx-itemIdx-setIdx" — így ugyanaz a gyakorlat
  // különböző blokkokban (pl. bemelegítés és levezetés) független szettnek számít.
  slotId?: string;
  reps?: number;
  durationSec?: number;
  // RPE 1-10: mennyire volt nehéz
  rpe?: number;
  done: boolean;
};

export type WorkoutLog = {
  id: string;           // pl. "w3-push-2026-05-15"
  weekIndex: number;
  sessionId: string;
  date: string;         // ISO yyyy-mm-dd
  sets: SetLog[];
  durationMin?: number;
  feeling?: 1 | 2 | 3 | 4 | 5;  // 1=szar, 5=szuper
  notes?: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  text: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  sleep?: number; // óra
};

export type Settings = {
  weeklyStartDay: 1; // hétfő
  notifications: boolean;
};

export type AppState = {
  profile: Profile;
  settings: Settings;
  weights: WeightEntry[];
  workouts: WorkoutLog[];
  journal: JournalEntry[];
  // Mely heti edzéseket csinálta meg — {weekIndex: {sessionId: dateISO}}
  completed: Record<string, string>;
  // App állapot
  currentWeek: number;
  // Egyszer lefutó migrációk azonosítói
  migrations?: string[];
};

const DEFAULT_STATE: AppState = {
  profile: {
    name: "Te",
    age: 28,
    heightCm: 178,
    startWeightKg: 89,
    goalWeightKg: 75,
    startDate: new Date().toISOString().slice(0, 10),
  },
  settings: {
    weeklyStartDay: 1,
    notifications: false,
  },
  weights: [],
  workouts: [],
  journal: [],
  completed: {},
  currentWeek: 1,
};

const KEY = "calisthenics-app-v1";

function readState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const merged: AppState = {
      ...DEFAULT_STATE,
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
    };
    const migrated = runMigrations(merged);
    if (migrated !== merged) {
      // Mentjük is a változásokat, hogy ne fusson le újra
      localStorage.setItem(KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return DEFAULT_STATE;
  }
}

// Egyszer-futó migrációk. A `migrations` tömb tartalmazza a már lefutott ID-ket.
function runMigrations(s: AppState): AppState {
  const done = new Set(s.migrations ?? []);
  let next = s;

  // m1: a régi (slotId nélküli) edzéseket utólag késznek jelöli,
  // ha van feeling vagy >=12 perc. Azóta automatikusan kezeljük, de a régi
  // felhasználói adatokra szükség van rá.
  if (!done.has("m1-complete-by-feeling")) {
    const completed = { ...next.completed };
    let changed = false;
    for (const w of next.workouts) {
      const key = `w${w.weekIndex}-${w.sessionId}`;
      if (completed[key]) continue;
      const hasDone = w.sets.some((x) => x.done);
      const isComplete = hasDone && (!!w.feeling || (w.durationMin ?? 0) >= 12);
      if (isComplete) {
        completed[key] = w.date;
        completed[`w${w.weekIndex}`] = w.date;
        changed = true;
      }
    }
    if (changed) next = { ...next, completed };
    done.add("m1-complete-by-feeling");
  }

  if (done.size !== (s.migrations?.length ?? 0)) {
    next = { ...next, migrations: Array.from(done) };
  }
  return next;
}

function writeState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  // Eseményt küldünk, hogy más komponensek frissüljenek
  window.dispatchEvent(new Event("app-state-changed"));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readState());
    setReady(true);
    const onChange = () => setState(readState());
    window.addEventListener("app-state-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("app-state-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((mut: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = mut(prev);
      writeState(next);
      return next;
    });
  }, []);

  return { state, ready, update };
}

// ===== Helpers =====

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeCurrentWeek(profile: Profile) {
  const diff = daysBetween(profile.startDate, todayISO());
  return Math.max(1, Math.min(26, Math.floor(diff / 7) + 1));
}

export function exportState(): string {
  return JSON.stringify(readState(), null, 2);
}

export function importState(json: string) {
  const parsed = JSON.parse(json) as AppState;
  writeState(parsed);
}

export function resetState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("app-state-changed"));
}
