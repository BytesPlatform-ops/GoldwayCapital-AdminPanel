import { LeadSource, PipelineStage, UserRole } from "@prisma/client";

/** Maps a lead source enum to its GHL tag, form name, and Medicare flag. */
export interface LeadSourceDef {
  source: LeadSource;
  key: string; // url/path key: medicare, final-expense, ...
  label: string;
  ghlTag: string;
  formName: string;
  serviceInterest: string;
  isMedicare: boolean;
  isRecruiting: boolean;
}

export const LEAD_SOURCE_DEFS: LeadSourceDef[] = [
  { source: "MEDICARE", key: "medicare", label: "Medicare", ghlTag: "medicare", formName: "Medicare Consultation Request", serviceInterest: "Medicare Solutions", isMedicare: true, isRecruiting: false },
  { source: "FINAL_EXPENSE", key: "final-expense", label: "Final Expense", ghlTag: "final-expense", formName: "Final Expense Inquiry", serviceInterest: "Final Expense", isMedicare: false, isRecruiting: false },
  { source: "REVERSE_MTG", key: "reverse-mortgage", label: "Reverse Mortgage", ghlTag: "reverse-mtg", formName: "Reverse Mortgage Inquiry", serviceInterest: "Reverse Mortgage Solutions", isMedicare: false, isRecruiting: false },
  { source: "PROBATE", key: "probate", label: "Probate / Senior Real Estate", ghlTag: "probate", formName: "Senior Real Estate & Probate Inquiry", serviceInterest: "Senior Real Estate & Probate Solutions", isMedicare: false, isRecruiting: false },
  { source: "RECRUITING", key: "recruiting", label: "Join Our Team", ghlTag: "recruiting", formName: "Medicare Agent Opportunities", serviceInterest: "Recruiting", isMedicare: false, isRecruiting: true },
  { source: "CONTACT", key: "contact", label: "Contact", ghlTag: "contact", formName: "Contact Form", serviceInterest: "General Inquiry", isMedicare: false, isRecruiting: false },
];

export function leadSourceByPath(key: string): LeadSourceDef | undefined {
  return LEAD_SOURCE_DEFS.find((d) => d.key === key);
}
export function leadSourceDef(source: LeadSource): LeadSourceDef {
  return LEAD_SOURCE_DEFS.find((d) => d.source === source)!;
}

/** Maps our pipeline stage to the env key holding the GHL stage id. */
export const GHL_STAGE_ENV: Record<PipelineStage, string> = {
  NEW: "GHL_STAGE_NEW_ID",
  CONTACTED: "GHL_STAGE_CONTACTED_ID",
  APPOINTMENT_SET: "GHL_STAGE_APPOINTMENT_SET_ID",
  CLOSED: "GHL_STAGE_CLOSED_ID",
};

export const SOA_EXTERNAL_WARNING =
  "SOA documentation and enrollment details must remain in the approved FMO/carrier portal.";
export const HEALTH_INFO_WARNING =
  "Please do not include medical, prescription, health, coverage, or enrollment details in this form.";
export const NOTE_HEALTH_WARNING =
  "Do not enter medical, health, coverage, prescription, or enrollment details here.";

// The health-data denylist. Inbound fields whose normalized name matches are
// hard-rejected at the boundary; values are never stored or logged.
export const BLOCKED_FIELD_NAMES: string[] = [
  "medicalcondition", "medicalconditions", "condition", "conditions",
  "medication", "medications", "prescription", "prescriptions", "drug", "drugs",
  "doctor", "doctors", "physician",
  "medicarecardnumber", "medicarenumber", "medicarecard", "medicareid", "hicn", "mbi",
  "healthhistory", "medicalhistory", "diagnosis", "healthconditions",
  "coverage", "coveragedetails", "currentcoverage", "existingplan", "existingplans",
  "plandetails", "planid", "policynumber", "policydetails",
  "prescriptioninfo", "prescriptioninformation",
  "enrollment", "enrollmentinfo", "enrollmentinformation",
  "ssn", "socialsecurity", "socialsecuritynumber", "dateofbirth", "dob",
];

export const HEALTH_TERM_HINTS: string[] = [
  "diagnos", "medication", "prescription", "medicare card", "policy number",
  "coverage detail", "existing plan", "enrollment", "condition",
  "blood pressure", "diabetes", "cancer",
];

// Permission keys, and which roles hold them (RBAC).
export const PERMISSIONS = [
  "leads.view", "leads.update", "leads.assign", "leads.stage_change",
  "notes.create", "calls.create", "emails.send", "tasks.manage", "appointments.manage",
  "content.create", "content.review", "content.publish",
  "compliance.manage", "settings.manage", "users.manage", "audit.view", "integrations.manage",
  // Destructive record deletion — admins only (see ROLE_PERMISSIONS; not granted to VA).
  "records.delete",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ALL,
  DEVELOPER_ADMIN: ALL,
  VA: ["leads.view", "leads.update", "leads.stage_change", "notes.create", "calls.create", "emails.send", "tasks.manage", "appointments.manage", "content.create"],
  CONTENT_EDITOR: ["leads.view", "content.create", "content.review"],
  COMPLIANCE_REVIEWER: ["leads.view", "content.review", "content.publish", "compliance.manage", "audit.view"],
};

export function roleHasPermission(role: UserRole, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
