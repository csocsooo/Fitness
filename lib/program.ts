// 6 hónapos calisthenics program — 26 hét, 4 fázis.
// Heti 4 kemény edzés + napi séta + 1 mobilitás nap.
// Felépítés: erő / hipertrófia / állóképesség.

export type SetSpec = {
  exerciseId: string;
  sets: number;
  reps?: number;             // ismétlésszám
  durationSec?: number;      // idő-alapú (plank, jacks)
  restSec: number;           // pihenő szettek között
  note?: string;
};

export type WorkoutBlock = {
  title: string;             // pl. "Bemelegítés", "Erő", "Finisher", "Levezetés"
  items: SetSpec[];
};

export type Session = {
  id: string;                // pl. "w1-d1"
  name: string;              // pl. "Push + Core"
  focus: string;             // rövid leírás
  estMinutes: number;
  blocks: WorkoutBlock[];
};

export type Week = {
  index: number;             // 1..26
  phase: 1 | 2 | 3 | 4;
  phaseName: string;
  theme: string;             // hét célja
  sessions: Session[];       // 4–5 / hét
  cardio: string;            // heti kardio cél (séta, plusz mozgás)
};

const REST_SHORT = 45;
const REST_MED = 60;
const REST_LONG = 90;

// segéd: ismétlésszám fokozatosság
function reps(base: number, week: number, plus = 0) {
  return Math.max(5, base + Math.floor(week / 3) + plus);
}

function bemelegites(): WorkoutBlock {
  return {
    title: "Bemelegítés (5 perc)",
    items: [
      { exerciseId: "jumping-jack", sets: 1, durationSec: 60, restSec: 15 },
      { exerciseId: "cat-cow", sets: 1, reps: 10, restSec: 15 },
      { exerciseId: "world-greatest", sets: 1, reps: 6, restSec: 15, note: "3 oldalanként" },
      { exerciseId: "ytw", sets: 1, reps: 8, restSec: 15 },
    ],
  };
}

function levezetes(): WorkoutBlock {
  return {
    title: "Levezetés / nyújtás (5 perc)",
    items: [
      { exerciseId: "hip-flexor-stretch", sets: 1, durationSec: 60, restSec: 10, note: "30 mp oldalanként" },
      { exerciseId: "thoracic-rotation", sets: 1, reps: 10, restSec: 10 },
      { exerciseId: "cat-cow", sets: 1, reps: 10, restSec: 10 },
    ],
  };
}

// ============ FÁZISOK ============

// 1. fázis (1–8. hét) – ALAPOZÁS: szokás, technika, mozgástartomány.
// 2. fázis (9–16. hét) – ÉPÍTÉS: erő, izomtömeg, hosszabb körök.
// 3. fázis (17–22. hét) – INTENZITÁS: terjedelem, tempó, finisherek.
// 4. fázis (23–26. hét) – CSÚCS: maximális kalória-égetés, állóképesség.

function pushDay(week: number, phase: 1 | 2 | 3 | 4): Session {
  const baseReps = phase === 1 ? 6 : phase === 2 ? 10 : 12;
  const setCount = phase === 1 ? 3 : 4;
  const main: SetSpec = phase === 1
    ? { exerciseId: "incline-pushup", sets: setCount, reps: reps(baseReps, week), restSec: REST_MED }
    : phase === 2
    ? { exerciseId: "pushup", sets: setCount, reps: reps(baseReps, week), restSec: REST_MED }
    : { exerciseId: "decline-pushup", sets: setCount, reps: reps(baseReps, week), restSec: REST_MED };
  return {
    id: `w${week}-push`,
    name: "Push nap (mell, váll, tricepsz)",
    focus: "Felsőtest tolómozgások — fekvőtámasz alapok és variációk.",
    estMinutes: 35,
    blocks: [
      bemelegites(),
      {
        title: "Fő erő blokk",
        items: [
          main,
          { exerciseId: "pike-pushup", sets: 3, reps: reps(6, week), restSec: REST_MED, note: "Vállra fókusz" },
          { exerciseId: "couch-dip", sets: 3, reps: reps(8, week), restSec: REST_MED, note: "Tricepsz" },
          { exerciseId: "diamond-pushup", sets: 2, reps: reps(5, week), restSec: REST_MED, note: "Térdelő ha kell" },
        ],
      },
      {
        title: "Core finisher",
        items: [
          { exerciseId: "plank", sets: 3, durationSec: 30 + week * 2, restSec: REST_SHORT },
        ],
      },
      levezetes(),
    ],
  };
}

function pullDay(week: number, phase: 1 | 2 | 3 | 4): Session {
  return {
    id: `w${week}-pull`,
    name: "Pull + hátsó lánc nap",
    focus: "Húzómozgások (kanapé alatt), ülőmunka ellen.",
    estMinutes: 35,
    blocks: [
      bemelegites(),
      {
        title: "Fő húzó blokk",
        items: [
          {
            exerciseId: "couch-row",
            sets: phase === 1 ? 3 : 4,
            reps: reps(6, week),
            restSec: REST_MED,
            note: "Stabil kanapénál. Ha nem stabil: ajtókeret húzás.",
          },
          { exerciseId: "doorway-row", sets: 3, reps: reps(8, week), restSec: REST_MED },
          { exerciseId: "superman", sets: 3, reps: reps(10, week), restSec: REST_SHORT },
          { exerciseId: "ytw", sets: 2, reps: 12, restSec: REST_SHORT },
        ],
      },
      {
        title: "Core finisher",
        items: [
          { exerciseId: "deadbug", sets: 3, reps: 10, restSec: REST_SHORT },
          { exerciseId: "side-plank", sets: 2, durationSec: 25 + week, restSec: REST_SHORT, note: "Oldalanként" },
        ],
      },
      levezetes(),
    ],
  };
}

function legsDay(week: number, phase: 1 | 2 | 3 | 4): Session {
  const main: SetSpec = phase === 1
    ? { exerciseId: "couch-squat", sets: 3, reps: reps(10, week), restSec: REST_MED }
    : { exerciseId: "squat", sets: 4, reps: reps(15, week), restSec: REST_MED };
  return {
    id: `w${week}-legs`,
    name: "Láb + fenék",
    focus: "Erős láb = több energia, magasabb anyagcsere.",
    estMinutes: 35,
    blocks: [
      bemelegites(),
      {
        title: "Fő láb blokk",
        items: [
          main,
          { exerciseId: "split-squat", sets: 3, reps: reps(8, week), restSec: REST_MED, note: "Oldalanként" },
          { exerciseId: "glute-bridge", sets: 3, reps: reps(12, week), restSec: REST_SHORT },
          { exerciseId: "lunge", sets: 3, reps: reps(10, week), restSec: REST_MED },
          { exerciseId: "calf-raise", sets: 2, reps: reps(15, week), restSec: REST_SHORT },
        ],
      },
      {
        title: "Finisher",
        items: [
          { exerciseId: "wall-sit", sets: 2, durationSec: 30 + week * 2, restSec: REST_SHORT },
        ],
      },
      levezetes(),
    ],
  };
}

function conditioningDay(week: number, phase: 1 | 2 | 3 | 4): Session {
  // Kondi nap: körkörös HIIT, zsírégetés + stamina építés.
  const round = phase === 1 ? 3 : phase === 2 ? 4 : 5;
  const work = phase === 1 ? 30 : phase === 2 ? 40 : 45;
  return {
    id: `w${week}-cond`,
    name: "Kondi & stamina (HIIT)",
    focus: `Körkörös zsírégető — ${round} kör, ${work} mp munka / 20 mp pihenő gyakorlatonként.`,
    estMinutes: 30,
    blocks: [
      bemelegites(),
      {
        title: `Kör (${round}×)`,
        items: [
          { exerciseId: "jumping-jack", sets: round, durationSec: work, restSec: 20 },
          { exerciseId: "squat", sets: round, durationSec: work, restSec: 20 },
          { exerciseId: "mountain-climber", sets: round, durationSec: work, restSec: 20 },
          { exerciseId: phase >= 2 ? "burpee" : "high-knee", sets: round, durationSec: work, restSec: 20 },
          { exerciseId: "shadow-box", sets: round, durationSec: work, restSec: 60, note: "60 mp pihenő a kör után" },
        ],
      },
      levezetes(),
    ],
  };
}

function fullBodyDay(week: number, phase: 1 | 2 | 3 | 4): Session {
  return {
    id: `w${week}-full`,
    name: "Teljes test komplex",
    focus: "Push + pull + láb + core egyben — kevés idő, sok érték.",
    estMinutes: 30,
    blocks: [
      bemelegites(),
      {
        title: phase >= 3 ? "AMRAP 15 perc" : "3 kör folyamatosan",
        items: [
          { exerciseId: "pushup", sets: 3, reps: phase >= 2 ? 10 : 6, restSec: 30 },
          { exerciseId: "squat", sets: 3, reps: 15, restSec: 30 },
          { exerciseId: "couch-row", sets: 3, reps: 8, restSec: 30 },
          { exerciseId: "plank", sets: 3, durationSec: 30, restSec: 30 },
          { exerciseId: "lunge", sets: 3, reps: 10, restSec: 30, note: "10 oldalanként" },
        ],
      },
      levezetes(),
    ],
  };
}

function mobilityDay(): Session {
  return {
    id: `mobility`,
    name: "Mobilitás + séta",
    focus: "Aktív pihenő — gerinc, csípő mobilitás, hosszú séta.",
    estMinutes: 25,
    blocks: [
      {
        title: "Mobilitás",
        items: [
          { exerciseId: "cat-cow", sets: 2, reps: 12, restSec: 15 },
          { exerciseId: "world-greatest", sets: 2, reps: 6, restSec: 15 },
          { exerciseId: "hip-flexor-stretch", sets: 2, durationSec: 60, restSec: 15, note: "Oldalanként" },
          { exerciseId: "thoracic-rotation", sets: 2, reps: 10, restSec: 15 },
        ],
      },
      {
        title: "Stamina",
        items: [{ exerciseId: "walk", sets: 1, durationSec: 45 * 60, restSec: 0, note: "Cél: legalább 45 perc séta." }],
      },
    ],
  };
}

function buildWeek(index: number): Week {
  const phase: 1 | 2 | 3 | 4 = index <= 8 ? 1 : index <= 16 ? 2 : index <= 22 ? 3 : 4;
  const phaseName =
    phase === 1 ? "1. fázis — Alapozás"
    : phase === 2 ? "2. fázis — Építés"
    : phase === 3 ? "3. fázis — Intenzitás"
    : "4. fázis — Csúcs";
  const theme =
    phase === 1 ? "Szokás, technika, mozgástartomány. Lassú, tudatos. Ne hajts."
    : phase === 2 ? "Erő és izom. Több szett, nehezebb variációk."
    : phase === 3 ? "Több ismétlés, tempó, finisherek. A pulzus magasan marad."
    : "Csúcsforma — sok kardio, kemény körök, állóképesség teszt.";

  // Heti elosztás (4 erő + 1 kondi + 1 mobi + 1 pihi vagy 5 erő/kondi + 1 mobi):
  const sessions: Session[] = [
    pushDay(index, phase),
    pullDay(index, phase),
    legsDay(index, phase),
    conditioningDay(index, phase),
  ];
  if (phase >= 2) {
    sessions.push(fullBodyDay(index, phase));
  }
  sessions.push(mobilityDay());

  return {
    index,
    phase,
    phaseName,
    theme,
    sessions,
    cardio: "Napi minimum 7000 lépés + 2 óránként 5 perc mikro-séta a munkanapokon.",
  };
}

export const PROGRAM: Week[] = Array.from({ length: 26 }, (_, i) => buildWeek(i + 1));

export function getWeek(index: number): Week | undefined {
  return PROGRAM.find((w) => w.index === index);
}

// Heti súlycél (lineáris cél 89 -> 75 kg, 26 hét)
export function targetWeightForWeek(week: number, start = 89, end = 75): number {
  const total = PROGRAM.length;
  const t = Math.min(Math.max(week, 1), total);
  return +(start + ((end - start) * (t - 1)) / (total - 1)).toFixed(1);
}
