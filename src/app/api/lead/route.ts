import { NextRequest, NextResponse } from "next/server";
import type { LeadSource } from "@prisma/client";
import { handle, requestContext } from "@/lib/http";
import { services } from "@/server/services";
import { toCreateLeadDto } from "@/server/dto/create-lead.dto";

export const dynamic = "force-dynamic";

const MAP: Record<string, LeadSource> = {
  medicare: "MEDICARE",
  "final-expense": "FINAL_EXPENSE",
  "reverse-mortgage": "REVERSE_MTG",
  probate: "PROBATE",
  recruiting: "RECRUITING",
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const source = MAP[String(body.source ?? "")];
  if (!source) return NextResponse.json({ ok: false, message: "Invalid form source" }, { status: 400 });
  const { source: _omit, ...payload } = body;
  return handle(() => services.forms.intake(source, toCreateLeadDto(payload), payload, requestContext(req)), 201);
}
