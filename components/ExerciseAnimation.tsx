"use client";

import { useEffect, useState } from "react";

const CDN = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export default function ExerciseAnimation({
  dbId,
  size = "md",
}: {
  dbId?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState<[boolean, boolean]>([false, false]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!dbId) return;
    const t = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 600);
    return () => clearInterval(t);
  }, [dbId]);

  if (!dbId || failed) {
    return (
      <div
        className={
          "rounded-lg bg-panel2 border border-line flex items-center justify-center text-muted text-xs " +
          (size === "sm" ? "h-24" : size === "lg" ? "h-64" : "h-40")
        }
      >
        Nincs illusztráció — kövesd a leírást.
      </div>
    );
  }

  const url0 = `${CDN}/${dbId}/0.jpg`;
  const url1 = `${CDN}/${dbId}/1.jpg`;
  const heightClass = size === "sm" ? "h-24" : size === "lg" ? "h-64" : "h-40";

  return (
    <div className={"relative rounded-lg overflow-hidden bg-white border border-line " + heightClass}>
      {/* Két képet egymásra tesszük, opacity-vel váltogatva — pre-cache van */}
      <img
        src={url0}
        alt=""
        className={
          "absolute inset-0 w-full h-full object-contain transition-opacity duration-150 " +
          (frame === 0 ? "opacity-100" : "opacity-0")
        }
        onLoad={() => setLoaded((l) => [true, l[1]])}
        onError={() => setFailed(true)}
        draggable={false}
      />
      <img
        src={url1}
        alt=""
        className={
          "absolute inset-0 w-full h-full object-contain transition-opacity duration-150 " +
          (frame === 1 ? "opacity-100" : "opacity-0")
        }
        onLoad={() => setLoaded((l) => [l[0], true])}
        onError={() => setFailed(true)}
        draggable={false}
      />
      {(!loaded[0] || !loaded[1]) && (
        <div className="absolute inset-0 flex items-center justify-center text-muted text-xs bg-panel2/60">
          Töltés…
        </div>
      )}
    </div>
  );
}
