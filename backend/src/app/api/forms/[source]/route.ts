import { NextRequest, NextResponse } from "next/server";
import type { LeadSource } from "@prisma/client";
import { handle, requestContext } from "@/lib/http";
import { services } from "@/server/services";
import { config } from "@/lib/config";
import { toCreateLeadDto } from "@/server/dto/create-lead.dto";
import { ForbiddenException } from "@/lib/errors";

export const dynamic = "force-dynamic";

const MAP: Record<string, LeadSource> = {
  medicare: "MEDICARE",
  "final-expense": "FINAL_EXPENSE",
  "reverse-mortgage": "REVERSE_MTG",
  probate: "PROBATE",
  recruiting: "RECRUITING",
};

export async function POST(req: NextRequest, { params }: { params: { source: string } }) {
  const source = MAP[params.source];
  if (!source) return NextResponse.json({ ok: false, message: "Invalid form source" }, { status: 404 });
  return handle(async () => {
    // Optional shared ingest key for the public website (skipped when unset).
    if (config.leadApiIngestKey && req.headers.get("x-goldway-key") !== config.leadApiIngestKey) {
      throw new ForbiddenException("Invalid ingest key");
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return services.forms.intake(source, toCreateLeadDto(body), body, requestContext(req));
  }, 201);
}
