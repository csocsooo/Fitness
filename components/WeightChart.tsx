"use client";

import type { WeightEntry } from "@/lib/store";

type Props = {
  data: WeightEntry[];
  start: number;
  goal: number;
  startDate: string;
  weeks?: number;
};

export default function WeightChart({ data, start, goal, startDate, weeks = 26 }: Props) {
  const days = weeks * 7;
  const startTs = new Date(startDate + "T00:00:00").getTime();
  const endTs = startTs + days * 24 * 3600 * 1000;
  const W = 720;
  const H = 240;
  const padL = 40, padR = 12, padT = 12, padB = 28;

  const min = Math.min(goal - 1, ...data.map((d) => d.kg), start);
  const max = Math.max(start + 1, ...data.map((d) => d.kg));
  const yRange = Math.max(2, max - min);

  function x(ts: number) {
    const t = (ts - startTs) / (endTs - startTs);
    return padL + Math.max(0, Math.min(1, t)) * (W - padL - padR);
  }
  function y(kg: number) {
    const t = (kg - min) / yRange;
    return padT + (1 - t) * (H - padT - padB);
  }

  // Cél vonal
  const goalLine = `M ${x(startTs)} ${y(start)} L ${x(endTs)} ${y(goal)}`;

  // Tényleges adatok útvonala
  const points = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ts: new Date(d.date + "T00:00:00").getTime(), kg: d.kg }));
  const actualLine =
    points.length === 0
      ? ""
      : points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.ts)} ${y(p.kg)}`).join(" ");

  // Y tick-ek
  const ticks: number[] = [];
  const step = Math.max(1, Math.ceil(yRange / 5));
  for (let v = Math.ceil(min); v <= Math.floor(max); v += step) ticks.push(v);

  // X tick-ek havonta
  const months: { ts: number; label: string }[] = [];
  for (let m = 0; m <= 6; m++) {
    const t = startTs + m * 30 * 24 * 3600 * 1000;
    months.push({ ts: t, label: `${m}h` });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]">
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={padL} x2={W - padR} y1={y(tv)} y2={y(tv)} stroke="#243042" strokeDasharray="2 4" />
            <text x={6} y={y(tv) + 4} fill="#7c8aa0" fontSize="11">{tv} kg</text>
          </g>
        ))}
        {months.map((m, i) => (
          <g key={i}>
            <line x1={x(m.ts)} x2={x(m.ts)} y1={padT} y2={H - padB} stroke="#1a2230" />
            <text x={x(m.ts)} y={H - 10} fill="#7c8aa0" fontSize="11" textAnchor="middle">
              {m.label}
            </text>
          </g>
        ))}
        <path d={goalLine} stroke="#22d3ee" strokeWidth="2" strokeDasharray="5 5" fill="none" />
        {actualLine && (
          <>
            <path d={actualLine} stroke="#a3e635" strokeWidth="2.5" fill="none" />
            {points.map((p, i) => (
              <circle key={i} cx={x(p.ts)} cy={y(p.kg)} r={3.5} fill="#a3e635" />
            ))}
          </>
        )}
        <text x={padL} y={padT + 12} fill="#22d3ee" fontSize="11">— cél (lineáris)</text>
        <text x={padL + 110} y={padT + 12} fill="#a3e635" fontSize="11">— tényleges</text>
      </svg>
    </div>
  );
}
