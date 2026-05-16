"use client";
import Link from "next/link";
import type { Session } from "@/lib/program";
import { todayISO, useAppState } from "@/lib/store";

type Props = {
  weekIndex: number;
  session: Session;
  done?: boolean;
  doneDate?: string;
};

export default function SessionCard({ weekIndex, session, done, doneDate }: Props) {
  const { update } = useAppState();

  function toggleDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    update((s) => {
      const completed = { ...s.completed };
      const key = `w${weekIndex}-${session.id}`;
      if (completed[key]) {
        delete completed[key];
        // weekly key is shared across sessions — csak akkor töröljük ha más session sincs kész
        const stillSome = Object.keys(completed).some((k) => k.startsWith(`w${weekIndex}-`));
        if (!stillSome) delete completed[`w${weekIndex}`];
      } else {
        completed[key] = todayISO();
        completed[`w${weekIndex}`] = todayISO();
      }
      return { ...s, completed };
    });
  }

  return (
    <div className={"card hover:border-accent/50 transition relative " + (done ? "opacity-80" : "")}>
      <Link href={`/edzes?w=${weekIndex}&s=${session.id}`} className="block">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{done ? "✅" : "💪"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="h3 text-white">{session.name}</h3>
              <span className="tag">{session.estMinutes} perc</span>
              {done && (
                <span className="tag !bg-accent2/20 !text-accent2 !border-accent2/40">
                  kész{doneDate ? ` · ${doneDate.slice(5)}` : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-muted mt-1">{session.focus}</p>
          </div>
        </div>
      </Link>
      <button
        onClick={toggleDone}
        title={done ? "Visszavonás" : "Megjelöld késznek"}
        className={
          "absolute top-2 right-2 w-8 h-8 rounded-full border text-sm transition " +
          (done
            ? "bg-accent2/20 border-accent2/50 text-accent2 hover:bg-accent2/30"
            : "bg-panel2 border-line text-muted hover:text-white hover:border-accent")
        }
      >
        {done ? "↺" : "✓"}
      </button>
    </div>
  );
}
