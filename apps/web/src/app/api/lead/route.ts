import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy: the public LeadForm posts here; we attach the secret ingest
 * key and forward to the NestJS backend. Keeps the key out of the browser.
 */
const API = process.env.API_URL ?? "http://localhost:4000";
const INGEST_KEY = process.env.LEAD_API_INGEST_KEY ?? "";

const VALID_SOURCES = ["medicare", "final-expense", "reverse-mortgage", "probate", "recruiting"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const source = String(body.source ?? "");
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json({ ok: false, message: "Invalid form source" }, { status: 400 });
  }
  const { source: _omit, ...payload } = body;

  const res = await fetch(`${API}/forms/${source}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goldway-key": INGEST_KEY },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({ ok: false, message: "Upstream error" }));
  return NextResponse.json(data, { status: res.status });
}
