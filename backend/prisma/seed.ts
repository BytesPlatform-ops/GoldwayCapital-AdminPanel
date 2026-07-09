import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { LEAD_SOURCE_DEFS, ROLE_PERMISSIONS, PERMISSIONS } from "../src/lib/constants";

const prisma = new PrismaClient();

const ROLE_META: Record<UserRole, string> = {
  OWNER: "Full access — the business owner.",
  VA: "Virtual assistant — works leads, follow-up, calls, scheduling.",
  CONTENT_EDITOR: "Drafts Resource Center content.",
  COMPLIANCE_REVIEWER: "Reviews and approves compliance-sensitive content.",
  DEVELOPER_ADMIN: "Technical administrator — full access.",
};

const COMPLIANCE_RULES = [
  { phrase: "government approved", severity: "block", category: "medicare", message: "Implies government endorsement — prohibited by CMS marketing guidelines." },
  { phrase: "medicare endorsed", severity: "block", category: "medicare", message: "Implies Medicare/government endorsement — prohibited." },
  { phrase: "official medicare", severity: "block", category: "medicare", message: "Implies official Medicare affiliation — prohibited." },
  { phrase: "we guarantee", severity: "block", category: "general", message: "Guarantee language is non-compliant for these services." },
  { phrase: "best plan", severity: "warn", category: "medicare", message: "Superlative plan claim — qualify or remove." },
  { phrase: "free money", severity: "block", category: "general", message: "Misleading financial claim." },
  { phrase: "we provide forward mortgages", severity: "block", category: "mortgage", message: "Forward mortgage is REFERRED OUT — use 'connect you with' / 'refer'." },
  { phrase: "we provide all real estate services", severity: "block", category: "real-estate", message: "Only probate/senior real estate is performed directly; other services are referred." },
];

const DISCLOSURES = [
  { key: "medicare", servicePage: "Medicare Solutions", title: "Medicare Disclosure", required: true, body: "Goldway Capital is a licensed insurance agency (NPN: [AGENCY_NPN]). We are not connected with or endorsed by the U.S. government or the federal Medicare program. This is a solicitation of insurance; a licensed agent may contact you. We comply with current CMS marketing guidelines." },
  { key: "reverse-mortgage", servicePage: "Reverse Mortgage Solutions", title: "Reverse Mortgage Disclosure", required: true, body: "Reverse mortgage services provided by Goldway Capital's licensed specialist (NMLS #: [NMLS_NUMBER]), sponsored by [LENDER]. Equal Housing Lender. This material is not from HUD or FHA and was not approved by any government agency." },
  { key: "probate", servicePage: "Senior Real Estate & Probate Solutions", title: "Real Estate & Probate Disclosure", required: true, body: "Real estate services provided through [BROKERAGE], a licensed real estate broker. Probate services are subject to applicable state law and court supervision. [STATE_SPECIFIC_PROBATE_LANGUAGE]." },
  { key: "forward-mortgage-referral", servicePage: "Reverse Mortgage Solutions", title: "Forward Mortgage Referral Notice", required: false, body: "For purchase or refinance (forward) mortgages, Goldway Capital does not originate loans directly; we can connect you with a trusted licensed lender partner." },
  { key: "real-estate-referral", servicePage: "Senior Real Estate & Probate Solutions", title: "Real Estate Referral Notice", required: false, body: "For real estate needs outside probate and senior downsizing, Goldway Capital can refer you to a licensed professional partner." },
];

const SETTINGS = [
  { key: "org.name", value: "Goldway Capital LLC", isSecret: false, category: "general", description: "Legal business name." },
  { key: "org.agency_npn", value: "", isSecret: false, category: "compliance", description: "Agency NPN shown in the Medicare disclosure." },
  { key: "org.nmls_number", value: "", isSecret: false, category: "compliance", description: "NMLS number for reverse mortgage disclosure." },
  { key: "recruiting.review_days", value: "Tuesday,Thursday", isSecret: false, category: "recruiting", description: "Days the owner reviews recruiting inquiries." },
];

async function main() {
  console.log("Seeding Goldway Capital (PostgreSQL)...");

  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, description: key } });
  }

  for (const key of Object.keys(ROLE_PERMISSIONS) as UserRole[]) {
    await prisma.role.upsert({
      where: { key },
      update: { name: key, description: ROLE_META[key], permissions: ROLE_PERMISSIONS[key] as unknown as string[] },
      create: { key, name: key, description: ROLE_META[key], permissions: ROLE_PERMISSIONS[key] as unknown as string[] },
    });
  }

  const pw = await bcrypt.hash("Goldway#2026", 10);
  const users: { email: string; name: string; role: UserRole }[] = [
    { email: "owner@goldwaycapital.com", name: "Goldway Owner", role: "OWNER" },
    { email: "va@goldwaycapital.com", name: "Virtual Assistant", role: "VA" },
    { email: "editor@goldwaycapital.com", name: "Content Editor", role: "CONTENT_EDITOR" },
    { email: "compliance@goldwaycapital.com", name: "Compliance Reviewer", role: "COMPLIANCE_REVIEWER" },
    { email: "dev@goldwaycapital.com", name: "Developer Admin", role: "DEVELOPER_ADMIN" },
  ];
  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: { name: u.name, role: u.role }, create: { ...u, passwordHash: pw } });
  }

  for (const r of COMPLIANCE_RULES) {
    const existing = await prisma.complianceRule.findFirst({ where: { phrase: r.phrase } });
    if (!existing) await prisma.complianceRule.create({ data: r });
  }
  for (const d of DISCLOSURES) {
    await prisma.disclosureBlock.upsert({ where: { key: d.key }, update: d, create: d });
  }
  for (const s of SETTINGS) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { description: s.description, category: s.category, isSecret: s.isSecret }, create: s });
  }

  // Sample/demo leads are OFF by default → clean production start.
  // Set SEED_SAMPLE_DATA=true to populate a few demo leads for local testing.
  if (process.env.SEED_SAMPLE_DATA === "true") {
    const va = await prisma.user.findUnique({ where: { email: "va@goldwaycapital.com" } });
    if ((await prisma.lead.count()) === 0) {
      await prisma.lead.createMany({
        data: [
          { firstName: "Margaret", lastName: "Ellis", email: "margaret@example.com", phone: "555-0101", city: "Phoenix", state: "AZ", zipCode: "85001", serviceInterest: "Medicare Solutions", leadSource: "MEDICARE", formName: LEAD_SOURCE_DEFS[0].formName, pipelineStage: "NEW", ghlSyncStatus: "SYNCED_MOCK", consentGiven: true, consentTimestamp: new Date(), preferredContactMethod: "phone", preferredContactTime: "morning", soaRequired: true, soaStatus: "REQUIRED", assignedToId: va?.id ?? null },
          { firstName: "Harold", lastName: "Nguyen", email: "harold@example.com", phone: "555-0102", city: "Tucson", state: "AZ", zipCode: "85701", serviceInterest: "Reverse Mortgage Solutions", leadSource: "REVERSE_MTG", formName: LEAD_SOURCE_DEFS[2].formName, pipelineStage: "CONTACTED", ghlSyncStatus: "SYNCED_MOCK", consentGiven: true, consentTimestamp: new Date(), preferredContactMethod: "email", lastContactedAt: new Date(), nextFollowUpAt: new Date(Date.now() - 86400000) },
          { firstName: "Denise", lastName: "Carter", email: "denise@example.com", phone: "555-0103", city: "Mesa", state: "AZ", zipCode: "85201", serviceInterest: "Recruiting", leadSource: "RECRUITING", formName: LEAD_SOURCE_DEFS[4].formName, pipelineStage: "NEW", ghlSyncStatus: "SYNCED_MOCK", consentGiven: true, consentTimestamp: new Date(), recruitingStatus: "NEW" },
        ],
      });
      console.log("Seeded demo leads (SEED_SAMPLE_DATA=true).");
    }
  }

  console.log("Seed complete (reference data only). Login: owner@goldwaycapital.com / Goldway#2026 (CHANGE THIS)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
