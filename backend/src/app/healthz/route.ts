import { NextResponse } from "next/server";

// Diagnostic route handler OUTSIDE /api — the middleware matcher is /api/:path*,
// so this bypasses middleware. If /healthz works but /api/health 400s, the
// middleware is the cause.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, where: "healthz-no-middleware", node: process.version });
}
