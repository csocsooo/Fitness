import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Otthoni Calisthenics — 6 hónapos terv",
  description: "Személyre szabott 6 hónapos otthoni calisthenics fitness app",
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
          <footer className="text-center text-xs text-muted py-6">
            Hajrá! Minden nap egy lépés.
          </footer>
        </div>
      </body>
    </html>
  );
}
