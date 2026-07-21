import type { LeadSource } from "@prisma/client";
import { leadSourceDef } from "./constants";

/**
 * Central mapping for the 5 public lead forms. Each form's incoming payload keys
 * are whitelisted here and mapped to the GHL custom-field KEY (the `fieldKey`
 * GHL returns, e.g. `contact.turning_65`). The config resolves that key to the
 * field id via the GHL_CF_<NAME>_ID/_KEY env pairs.
 *
 * COMPLIANCE BOUNDARY: only the keys listed here are ever sent to GHL. No
 * medical condition, coverage detail, plan name, or enrollment field appears in
 * any map — for Medicare the single allowed health-adjacent field is
 * `currentlyEnrolledMedicare` (Yes/No). Anything the site sends that is not
 * whitelisted is dropped before it reaches the CRM.
 */

// Hidden + consent + timing fields that apply to every form.
export const COMMON_GHL_FIELDS: Record<string, string> = {
  leadSource: "contact.lead_source",
  campaign: "contact.campaign",
  landingPageUrl: "contact.landing_page_url",
  submissionDateTime: "contact.submission_date_and_time",
  bestTimeToCall: "contact.best_time_to_call",
  emailConsent: "contact.email_consent",
  smsConsent: "contact.sms_consent",
  tcpaConsentTimestamp: "contact.tcpa_consent_timestamp",
};

// Per-vertical form-answer fields → GHL custom-field key.
export const FORM_GHL_FIELDS: Record<LeadSource, Record<string, string>> = {
  MEDICARE: {
    county: "contact.county",
    turning65: "contact.turning_65",
    currentlyEnrolledMedicare: "contact.currently_enrolled_in_medicare",
    medicareHelpWith: "contact.i_need_help_with",
    medicareBiggestQuestion: "contact.medicare_biggest_question",
  },
  FINAL_EXPENSE: {
    ageRange: "contact.age_range",
    finalExpenseCoverage: "contact.currently_have_lifefinal_expense_coverage",
    finalExpenseMostImportant: "contact.final_expense_most_important",
  },
  REVERSE_MTG: {
    age62OrOlder: "contact.are_you_62_or_older",
    primaryResidence: "contact.is_this_your_primary_residence",
    estimatedHomeValue: "contact.estimated_home_value",
    estimatedMortgageBalance: "contact.estimated_mortgage_balance",
    reverseMortgageMainGoal: "contact.reverse_mortgage_main_goal",
    reverseMortgageBiggestConcern: "contact.reverse_mortgage_biggest_concern",
  },
  PROBATE: {
    // `state` is a native contact field (mapped from dto.state), not a custom field.
    realEstateSituation: "contact.real_estate_situation",
    executorOrHeir: "contact.executor_or_heir",
    realEstateTimeline: "contact.real_estate_timeline",
    realEstateDetails: "contact.real_estate_situation_details",
  },
  RECRUITING: {
    stateOfResidence: "contact.state_of_residence",
    insuranceLicense: "contact.currently_hold_insurance_license",
    licensedLines: "contact.licensed_lines",
    ahipCertified: "contact.ahip_certified_current_plan_year",
    recruitingBackground: "contact.recruiting_background",
  },
  CONTACT: {
    // General contact form. serviceInterest + preferredContactMethod are also
    // stored on the Lead (via the DTO); here they double as GHL custom fields.
    serviceInterest: "contact.service_interest",
    preferredContactMethod: "contact.preferred_contact_method",
    bestTimeToContact: "contact.best_time_to_contact",
    message: "contact.contact_message",
  },
};

// Required user-supplied fields per form (contact basics + the key qualifiers).
// Hidden/generated fields (submissionDateTime, tcpaConsentTimestamp) are filled
// server-side and are not listed here.
const COMMON_REQUIRED = ["firstName", "lastName", "phone"];
export const FORM_REQUIRED_FIELDS: Record<LeadSource, string[]> = {
  MEDICARE: [...COMMON_REQUIRED, "zipCode", "turning65", "currentlyEnrolledMedicare", "bestTimeToCall", "medicareHelpWith"],
  FINAL_EXPENSE: [...COMMON_REQUIRED, "ageRange", "finalExpenseCoverage", "bestTimeToCall"],
  REVERSE_MTG: [...COMMON_REQUIRED, "age62OrOlder", "primaryResidence", "estimatedHomeValue", "estimatedMortgageBalance", "reverseMortgageMainGoal", "bestTimeToCall"],
  PROBATE: [...COMMON_REQUIRED, "state", "realEstateSituation", "realEstateTimeline", "bestTimeToCall"],
  RECRUITING: [...COMMON_REQUIRED, "stateOfResidence", "insuranceLicense"],
  CONTACT: [...COMMON_REQUIRED, "email"],
};

/** All whitelisted per-form answer keys (common + vertical). */
export function allowedFormFieldKeys(source: LeadSource): string[] {
  return [...Object.keys(COMMON_GHL_FIELDS), ...Object.keys(FORM_GHL_FIELDS[source])];
}

/** The payloadKey → ghlFieldKey map for a form (common + vertical). */
export function ghlFieldMapFor(source: LeadSource): Record<string, string> {
  return { ...COMMON_GHL_FIELDS, ...FORM_GHL_FIELDS[source] };
}

/**
 * Build the GHL custom-field payload (keyed by GHL field key) from a bag of
 * whitelisted answer values. Blank/undefined values are skipped. Only mapped
 * keys survive — anything else is silently dropped (compliance whitelist).
 */
export function buildGhlCustomFields(source: LeadSource, values: Record<string, unknown>): Record<string, string> {
  const map = ghlFieldMapFor(source);
  const out: Record<string, string> = {};
  for (const [payloadKey, ghlKey] of Object.entries(map)) {
    const v = values[payloadKey];
    if (v === undefined || v === null || v === "") continue;
    out[ghlKey] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  return out;
}

/** Opportunity title for a lead in this vertical. */
export function opportunityName(source: LeadSource, firstName: string, lastName: string): string {
  return `${firstName} ${lastName} — ${leadSourceDef(source).label}`.trim();
}

/** Pick only the whitelisted vertical answer values a site sent (blank-dropped). */
export function pickFormAnswers(source: LeadSource, body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(FORM_GHL_FIELDS[source])) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") out[key] = body[key];
  }
  return out;
}

/** Normalize consent-ish inputs (checkbox, "true", "1", "yes") to Yes/No. */
export function normalizeYesNo(v: unknown): "Yes" | "No" {
  if (Array.isArray(v)) return v.length > 0 ? "Yes" : "No";
  const s = String(v ?? "").trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "on" || s === "y" ? "Yes" : "No";
}
