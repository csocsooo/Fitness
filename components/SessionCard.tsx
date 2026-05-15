"use client";
import Link from "next/link";
import type { Session } from "@/lib/program";

type Props = {
  weekIndex: number;
  session: Session;
  done?: boolean;
};

export default function SessionCard({ weekIndex, session, done }: Props) {
  return (
    <Link
      href={`/edzes?w=${weekIndex}&s=${session.id}`}
      className={"card hover:border-accent/50 transition block " + (done ? "opacity-70" : "")}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{done ? "✅" : "💪"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="h3 text-white">{session.name}</h3>
            <span className="tag">{session.estMinutes} perc</span>
            {done && <span className="tag !bg-accent2/20 !text-accent2 !border-accent2/40">kész</span>}
          </div>
          <p className="text-sm text-muted mt-1">{session.focus}</p>
        </div>
      </div>
    </Link>
  );
}
