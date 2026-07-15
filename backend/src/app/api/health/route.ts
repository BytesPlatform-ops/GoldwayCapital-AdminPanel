import { NextResponse } from "next/server";

// Dependency-free health check — imports nothing heavy (no Prisma, no services).
// Used to isolate runtime issues from module-load issues on the deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, service: "goldway-capital-api", node: process.version });
}
