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

// Per-form fields rendered into the follow-up task description, in display order,
// as [valueKey, humanLabel]. `bestTimeToCall` is the common timing field; contact
// basics (phone/email/location) and `message` are rendered separately. Probate's
// `state` is shown in the Location line, so it is not repeated here.
const TASK_FIELD_LABELS: Record<LeadSource, Array<[string, string]>> = {
  MEDICARE: [
    ["county", "County"],
    ["turning65", "Turning 65"],
    ["currentlyEnrolledMedicare", "Currently enrolled in Medicare"],
    ["medicareHelpWith", "Needs help with"],
    ["medicareBiggestQuestion", "Biggest question"],
    ["bestTimeToCall", "Best time to call"],
  ],
  FINAL_EXPENSE: [
    ["ageRange", "Age range"],
    ["finalExpenseCoverage", "Has current coverage"],
    ["finalExpenseMostImportant", "Most important"],
    ["bestTimeToCall", "Best time to call"],
  ],
  REVERSE_MTG: [
    ["age62OrOlder", "Age 62 or older"],
    ["primaryResidence", "Primary residence"],
    ["estimatedHomeValue", "Estimated home value"],
    ["estimatedMortgageBalance", "Estimated mortgage balance"],
    ["reverseMortgageMainGoal", "Main goal"],
    ["reverseMortgageBiggestConcern", "Biggest concern"],
    ["bestTimeToCall", "Best time to call"],
  ],
  PROBATE: [
    ["realEstateSituation", "Real estate situation"],
    ["executorOrHeir", "Executor or heir"],
    ["realEstateTimeline", "Timeline"],
    ["realEstateDetails", "Details"],
    ["bestTimeToCall", "Best time to call"],
  ],
  RECRUITING: [
    ["stateOfResidence", "State of residence"],
    ["insuranceLicense", "Holds insurance license"],
    ["licensedLines", "Licensed lines"],
    ["ahipCertified", "AHIP certified (current plan year)"],
    ["recruitingBackground", "Background"],
  ],
  CONTACT: [
    ["serviceInterest", "Service interest"],
    ["preferredContactMethod", "Preferred contact method"],
    ["bestTimeToContact", "Best time to contact"],
  ],
};

export interface TaskDescriptionInput {
  formName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  /** Merged answer bag: vertical answers + bestTimeToCall + contact basics + message. */
  values: Record<string, unknown>;
}

const hasValue = (v: unknown): boolean => v !== undefined && v !== null && String(v).trim() !== "";
const showValue = (v: unknown): string => (Array.isArray(v) ? v.join(", ") : String(v)).trim();

/**
 * Human-readable follow-up task body for a lead — the same text is stored on the
 * local FollowUpTask and pushed to the GHL task. Empty/missing fields are skipped
 * so no blank lines appear. Blocks are separated by a single blank line.
 */
export function buildTaskDescription(source: LeadSource, input: TaskDescriptionInput): string {
  const blocks: string[] = [`New ${input.formName} submission.`];

  const contact: string[] = [];
  if (hasValue(input.phone)) contact.push(`Phone: ${showValue(input.phone)}`);
  if (hasValue(input.email)) contact.push(`Email: ${showValue(input.email)}`);
  const cityState = [input.city, input.state].filter(hasValue).map(showValue).join(", ");
  const location = [cityState, hasValue(input.zipCode) ? showValue(input.zipCode) : ""].filter(Boolean).join(" ").trim();
  if (location) contact.push(`Location: ${location}`);
  if (contact.length) blocks.push(contact.join("\n"));

  const specifics = (TASK_FIELD_LABELS[source] ?? [])
    .filter(([key]) => hasValue(input.values[key]))
    .map(([key, label]) => `${label}: ${showValue(input.values[key])}`);
  if (specifics.length) blocks.push(specifics.join("\n"));

  if (hasValue(input.values.message)) blocks.push(`Message/Notes: ${showValue(input.values.message)}`);

  blocks.push("Reach out using the preferred method during the selected time window.");
  return blocks.join("\n\n");
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
