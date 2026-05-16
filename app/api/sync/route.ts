import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Egyszerű cloud sync. Sync kód = a felhasználó kulcsa. A localStorage állapot
// JSON-ként tárolódik a KV-ben "sync:<code>" kulcsnál. Last-write-wins.
//
// Ha a Vercel KV nincs konfigurálva (nincs env változó), elegáns hibát adunk.

async function getKv() {
  try {
    const mod = await import("@vercel/kv");
    if (!process.env.KV_REST_API_URL && !process.env.KV_URL) return null;
    return mod.kv;
  } catch {
    return null;
  }
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function validCode(c: string | null): c is string {
  if (!c) return false;
  return /^[a-zA-Z0-9_-]{6,32}$/.test(c);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!validCode(code)) return bad("Érvénytelen sync kód.");
  const kv = await getKv();
  if (!kv) return bad("Cloud sync nincs konfigurálva a szerveren (Vercel KV hiányzik).", 503);
  const data = await kv.get(`sync:${code}`);
  return NextResponse.json({ data: data ?? null });
}

export async function POST(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!validCode(code)) return bad("Érvénytelen sync kód.");
  const kv = await getKv();
  if (!kv) return bad("Cloud sync nincs konfigurálva a szerveren (Vercel KV hiányzik).", 503);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Érvénytelen JSON.");
  }
  if (!body || typeof body !== "object") return bad("Érvénytelen test.");
  // Méret korlát: 256 KB
  const serialized = JSON.stringify(body);
  if (serialized.length > 256 * 1024) return bad("Túl nagy adat (>256 KB).", 413);
  await kv.set(`sync:${code}`, body);
  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
