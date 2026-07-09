/**
 * SAFE FIELDS ONLY. Route handlers pick these fields off the request body; any
 * other field (health/coverage) is ignored here and additionally stripped by the
 * ComplianceService before the lead is written.
 */
export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  serviceInterest?: string;
  consentGiven?: boolean;
  sourcePageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  // Honeypot — bots fill it; humans never see it. Must be empty.
  website?: string;
  turnstileToken?: string;
  recaptchaToken?: string;
}

const ALLOWED: (keyof CreateLeadDto)[] = [
  "firstName", "lastName", "email", "phone", "city", "state", "zipCode",
  "preferredContactMethod", "preferredContactTime", "serviceInterest", "consentGiven",
  "sourcePageUrl", "utmSource", "utmMedium", "utmCampaign", "website", "turnstileToken", "recaptchaToken",
];

/** Whitelist a raw request body down to the safe CreateLeadDto shape. */
export function toCreateLeadDto(body: Record<string, unknown>): CreateLeadDto {
  const dto: Record<string, unknown> = {};
  for (const k of ALLOWED) if (body[k] !== undefined) dto[k] = body[k];
  return dto as unknown as CreateLeadDto;
}
