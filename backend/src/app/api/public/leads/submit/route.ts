import { NextRequest } from "next/server";
import type { LeadSource } from "@prisma/client";
import { handle, requestContext } from "@/lib/http";
import { services } from "@/server/services";
import { config } from "@/lib/config";
import { toCreateLeadDto } from "@/server/dto/create-lead.dto";
import { BadRequestException, ForbiddenException } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Public lead intake for the WordPress website (goldwaycapital.com).
 * Body must carry a `formType`; the rest is the standard lead payload.
 * Responds with the lead id and the calendar booking link for that vertical.
 */
const FORM_TYPES: Record<string, LeadSource> = {
  medicare: "MEDICARE",
  "final-expense": "FINAL_EXPENSE",
  "reverse-mortgage": "REVERSE_MTG",
  "reverse-mtg": "REVERSE_MTG",
  probate: "PROBATE",
  recruiting: "RECRUITING",
};

export async function POST(req: NextRequest) {
  return handle(async () => {
    // Optional shared ingest key for the public website (skipped when unset).
    if (config.leadApiIngestKey && req.headers.get("x-goldway-key") !== config.leadApiIngestKey) {
      throw new ForbiddenException("Invalid ingest key");
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const formType = String(body.formType ?? "").toLowerCase().trim().replace(/_/g, "-");
    const source = FORM_TYPES[formType];
    if (!source) {
      throw new BadRequestException(`Invalid or missing formType. Expected one of: ${[...new Set(Object.keys(FORM_TYPES))].join(", ")}`);
    }
    const result = await services.forms.intake(source, toCreateLeadDto(body), body, requestContext(req));
    return { ...result, calendarLink: config.calendarLinks[source] || null };
  }, 201);
}
