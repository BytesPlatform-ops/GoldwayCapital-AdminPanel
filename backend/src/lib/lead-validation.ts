import type { LeadSource } from "@prisma/client";
import { BadRequestException } from "./errors";
import { FORM_REQUIRED_FIELDS } from "./lead-forms";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed string value for a key; arrays count as present when non-empty. */
function val(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (Array.isArray(v)) return v.length ? "x" : "";
  return String(v ?? "").trim();
}

/**
 * Lightweight, dependency-free validation for a public lead submission. Throws
 * BadRequestException (→ 400) listing every problem. Only whitelisted fields are
 * ever forwarded to GHL elsewhere; this guards the required contract + formats.
 */
export function validateLeadSubmission(source: LeadSource, body: Record<string, unknown>): void {
  const errors: string[] = [];

  for (const key of FORM_REQUIRED_FIELDS[source]) {
    if (!val(body, key)) errors.push(`${key} is required`);
  }

  const email = val(body, "email");
  const phone = val(body, "phone");
  if (!email && !phone) errors.push("email or phone is required");
  if (email && !EMAIL_RE.test(email)) errors.push("email is invalid");

  const zip = val(body, "zipCode");
  if (zip && !/^\d{5}$/.test(zip)) errors.push("zipCode must be 5 digits");

  if (errors.length) throw new BadRequestException(`Validation failed: ${errors.join("; ")}`);
}
