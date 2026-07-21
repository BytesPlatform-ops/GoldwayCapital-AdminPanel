import { NextRequest } from "next/server";
import type { LeadSource } from "@prisma/client";
import { handle, requestContext } from "@/lib/http";
import { services } from "@/server/services";
import { config } from "@/lib/config";
import { toCreateLeadDto } from "@/server/dto/create-lead.dto";
import { BadRequestException, ForbiddenException } from "@/lib/errors";
import { preflight, withCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

/** CORS preflight for browser-based form posts (WordPress site). */
export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

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
  contact: "CONTACT",
};

export async function POST(req: NextRequest) {
  const res = await handle(async () => {
    // Optional shared ingest key for the public website (skipped when unset).
    if (config.leadApiIngestKey && req.headers.get("x-goldway-key") !== config.leadApiIngestKey) {
      throw new ForbiddenException("Invalid ingest key");
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const formType = String(body.formType ?? "").toLowerCase().trim().replace(/_/g, "-");
    const source = FORM_TYPES[formType];
    if (!source) {
      // TEMP DIAGNOSTIC (remove after debugging contact form): log the body when
      // the formType can't be resolved so we can see exactly what WP is sending.
      console.warn("[lead-intake][DIAG] unresolved formType=%j keys=%j body=%j", body.formType, Object.keys(body), body);
      throw new BadRequestException(`Invalid or missing formType. Expected one of: ${[...new Set(Object.keys(FORM_TYPES))].join(", ")}`);
    }
    try {
      const result = await services.forms.intake(source, toCreateLeadDto(body), body, requestContext(req));
      return { ...result, calendarLink: config.calendarLinks[source] || null };
    } catch (err) {
      // TEMP DIAGNOSTIC (remove after debugging contact form): on any rejection,
      // log the incoming field names + values, phone/email presence, and the exact
      // error message so we can see why validation fails.
      console.warn(
        "[lead-intake][DIAG] rejected source=%s keys=%j phonePresent=%s emailPresent=%s message=%s body=%j",
        source,
        Object.keys(body),
        !!String(body.phone ?? "").trim(),
        !!String(body.email ?? "").trim(),
        err instanceof Error ? err.message : String(err),
        body
      );
      throw err;
    }
  }, 201);
  return withCors(res, req);
}
