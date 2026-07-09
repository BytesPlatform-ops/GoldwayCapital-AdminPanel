import { Injectable } from "@/lib/nest";
import { PrismaService } from "@/db/prisma";
import { BLOCKED_FIELD_NAMES, HEALTH_TERM_HINTS } from "@/lib/constants";

export interface SanitizeResult {
  clean: Record<string, unknown>;
  blockedFields: string[];
}
export interface ComplianceHit {
  phrase: string;
  severity: "block" | "warn";
  category: string;
  message: string;
  index: number;
}
export interface ComplianceReport {
  passed: boolean;
  medicareSensitive: boolean;
  healthInfoSuspected: boolean;
  hits: ComplianceHit[];
  scannedAt: string;
}

const MEDICARE_MARKERS = ["medicare", "medicare advantage", "part d", "part c", "medigap", "medicare supplement"];

const FALLBACK_RULES: Array<Omit<ComplianceHit, "index">> = [
  { phrase: "government approved", severity: "block", category: "medicare", message: "Implies government endorsement — prohibited by CMS marketing guidelines." },
  { phrase: "medicare endorsed", severity: "block", category: "medicare", message: "Implies Medicare/government endorsement — prohibited." },
  { phrase: "official medicare", severity: "block", category: "medicare", message: "Implies official Medicare affiliation — prohibited." },
  { phrase: "we guarantee", severity: "block", category: "general", message: "Guarantee language is non-compliant for these services." },
  { phrase: "best plan", severity: "warn", category: "medicare", message: "Superlative plan claim — qualify or remove." },
  { phrase: "free money", severity: "block", category: "general", message: "Misleading financial claim." },
  { phrase: "we provide forward mortgages", severity: "block", category: "mortgage", message: "Forward mortgage is REFERRED OUT — use 'connect you with' / 'refer'." },
  { phrase: "we provide all real estate services", severity: "block", category: "real-estate", message: "Only probate/senior real estate is performed directly; other services are referred." },
];

export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeFieldName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /** Strip health/coverage fields at the boundary — values never retained/logged. */
  stripBlockedFields(input: Record<string, unknown>): SanitizeResult {
    const clean: Record<string, unknown> = {};
    const blockedFields: string[] = [];
    for (const [key, value] of Object.entries(input)) {
      if (BLOCKED_FIELD_NAMES.includes(this.normalizeFieldName(key))) blockedFields.push(key);
      else clean[key] = value;
    }
    return { clean, blockedFields };
  }

  /** Remove free-text message/notes fields (used for Medicare forms). */
  stripFreeText(input: Record<string, unknown>): { clean: Record<string, unknown>; removed: boolean } {
    const clean = { ...input };
    let removed = false;
    for (const key of Object.keys(clean)) {
      if (["message", "notes", "comments", "details", "additionalinfo"].includes(this.normalizeFieldName(key))) {
        delete clean[key];
        removed = true;
      }
    }
    return { clean, removed };
  }

  looksLikeHealthInfo(text?: string | null): boolean {
    if (!text) return false;
    const t = text.toLowerCase();
    return HEALTH_TERM_HINTS.some((h) => t.includes(h));
  }

  async scanText(text: string): Promise<ComplianceReport> {
    const lower = text.toLowerCase();
    const rules = await this.prisma.complianceRule.findMany({ where: { isActive: true } }).catch(() => []);
    const effective = rules.length > 0 ? rules : FALLBACK_RULES;

    const hits: ComplianceHit[] = [];
    for (const r of effective) {
      const idx = lower.indexOf(r.phrase.toLowerCase());
      if (idx !== -1) {
        hits.push({
          phrase: r.phrase,
          severity: (r.severity as "block" | "warn") ?? "block",
          category: r.category ?? "general",
          message: r.message,
          index: idx,
        });
      }
    }
    return {
      passed: !hits.some((h) => h.severity === "block"),
      medicareSensitive: MEDICARE_MARKERS.some((m) => lower.includes(m)),
      healthInfoSuspected: this.looksLikeHealthInfo(text),
      hits,
      scannedAt: new Date().toISOString(),
    };
  }

  scanContent(post: { title?: string | null; excerpt?: string | null; body?: string | null; socialCaption?: string | null; seoDescription?: string | null }) {
    const composite = [post.title, post.excerpt, post.body, post.socialCaption, post.seoDescription].filter(Boolean).join("\n\n");
    return this.scanText(composite);
  }

  getRules() {
    return this.prisma.complianceRule.findMany({ where: { isActive: true }, orderBy: { category: "asc" } });
  }
  getDisclosures() {
    return this.prisma.disclosureBlock.findMany({ orderBy: { servicePage: "asc" } });
  }
}
