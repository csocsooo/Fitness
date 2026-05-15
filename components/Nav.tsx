"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Ma" },
  { href: "/program", label: "Program" },
  { href: "/edzes", label: "Edzés" },
  { href: "/haladas", label: "Haladás" },
  { href: "/naplo", label: "Napló" },
  { href: "/gyakorlatok", label: "Gyakorlatok" },
  { href: "/beallitasok", label: "Beállítások" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="border-b border-line sticky top-0 z-10 backdrop-blur bg-bg/90">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 overflow-x-auto">
        <Link href="/" className="font-bold text-accent shrink-0">
          🏋️ Otthon Fit
        </Link>
        <div className="flex gap-1 ml-auto">
          {TABS.map((t) => {
            const active = path === t.href || (t.href !== "/" && path?.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition " +
                  (active ? "bg-accent text-black font-medium" : "text-white/70 hover:text-white hover:bg-panel2")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
