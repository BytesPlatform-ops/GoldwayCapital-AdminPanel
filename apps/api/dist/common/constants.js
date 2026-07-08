"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.HEALTH_TERM_HINTS = exports.BLOCKED_FIELD_NAMES = exports.NOTE_HEALTH_WARNING = exports.HEALTH_INFO_WARNING = exports.SOA_EXTERNAL_WARNING = exports.GHL_STAGE_ENV = exports.LEAD_SOURCE_DEFS = void 0;
exports.leadSourceByPath = leadSourceByPath;
exports.leadSourceDef = leadSourceDef;
exports.roleHasPermission = roleHasPermission;
exports.LEAD_SOURCE_DEFS = [
    { source: "MEDICARE", key: "medicare", label: "Medicare", ghlTag: "Medicare", formName: "Medicare Consultation Request", serviceInterest: "Medicare Solutions", isMedicare: true, isRecruiting: false },
    { source: "FINAL_EXPENSE", key: "final-expense", label: "Final Expense", ghlTag: "Final-Expense", formName: "Final Expense Inquiry", serviceInterest: "Final Expense", isMedicare: false, isRecruiting: false },
    { source: "REVERSE_MTG", key: "reverse-mortgage", label: "Reverse Mortgage", ghlTag: "Reverse-Mtg", formName: "Reverse Mortgage Inquiry", serviceInterest: "Reverse Mortgage Solutions", isMedicare: false, isRecruiting: false },
    { source: "PROBATE", key: "probate", label: "Probate / Senior Real Estate", ghlTag: "Probate", formName: "Senior Real Estate & Probate Inquiry", serviceInterest: "Senior Real Estate & Probate Solutions", isMedicare: false, isRecruiting: false },
    { source: "RECRUITING", key: "recruiting", label: "Join Our Team", ghlTag: "Recruiting", formName: "Medicare Agent Opportunities", serviceInterest: "Recruiting", isMedicare: false, isRecruiting: true },
];
function leadSourceByPath(key) {
    return exports.LEAD_SOURCE_DEFS.find((d) => d.key === key);
}
function leadSourceDef(source) {
    return exports.LEAD_SOURCE_DEFS.find((d) => d.source === source);
}
exports.GHL_STAGE_ENV = {
    NEW: "GHL_STAGE_NEW_ID",
    CONTACTED: "GHL_STAGE_CONTACTED_ID",
    APPOINTMENT_SET: "GHL_STAGE_APPOINTMENT_SET_ID",
    CLOSED: "GHL_STAGE_CLOSED_ID",
};
exports.SOA_EXTERNAL_WARNING = "SOA documentation and enrollment details must remain in the approved FMO/carrier portal.";
exports.HEALTH_INFO_WARNING = "Please do not include medical, prescription, health, coverage, or enrollment details in this form.";
exports.NOTE_HEALTH_WARNING = "Do not enter medical, health, coverage, prescription, or enrollment details here.";
exports.BLOCKED_FIELD_NAMES = [
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
exports.HEALTH_TERM_HINTS = [
    "diagnos", "medication", "prescription", "medicare card", "policy number",
    "coverage detail", "existing plan", "enrollment", "condition",
    "blood pressure", "diabetes", "cancer",
];
exports.PERMISSIONS = [
    "leads.view", "leads.update", "leads.assign", "leads.stage_change",
    "notes.create", "calls.create", "emails.send", "tasks.manage", "appointments.manage",
    "content.create", "content.review", "content.publish",
    "compliance.manage", "settings.manage", "users.manage", "audit.view", "integrations.manage",
];
const ALL = [...exports.PERMISSIONS];
exports.ROLE_PERMISSIONS = {
    OWNER: ALL,
    DEVELOPER_ADMIN: ALL,
    VA: ["leads.view", "leads.update", "leads.stage_change", "notes.create", "calls.create", "emails.send", "tasks.manage", "appointments.manage", "content.create"],
    CONTENT_EDITOR: ["leads.view", "content.create", "content.review"],
    COMPLIANCE_REVIEWER: ["leads.view", "content.review", "content.publish", "compliance.manage", "audit.view"],
};
function roleHasPermission(role, perm) {
    return exports.ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
//# sourceMappingURL=constants.js.map