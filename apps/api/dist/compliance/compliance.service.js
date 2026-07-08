"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const constants_1 = require("../common/constants");
const MEDICARE_MARKERS = ["medicare", "medicare advantage", "part d", "part c", "medigap", "medicare supplement"];
const FALLBACK_RULES = [
    { phrase: "government approved", severity: "block", category: "medicare", message: "Implies government endorsement — prohibited by CMS marketing guidelines." },
    { phrase: "medicare endorsed", severity: "block", category: "medicare", message: "Implies Medicare/government endorsement — prohibited." },
    { phrase: "official medicare", severity: "block", category: "medicare", message: "Implies official Medicare affiliation — prohibited." },
    { phrase: "we guarantee", severity: "block", category: "general", message: "Guarantee language is non-compliant for these services." },
    { phrase: "best plan", severity: "warn", category: "medicare", message: "Superlative plan claim — qualify or remove." },
    { phrase: "free money", severity: "block", category: "general", message: "Misleading financial claim." },
    { phrase: "we provide forward mortgages", severity: "block", category: "mortgage", message: "Forward mortgage is REFERRED OUT — use 'connect you with' / 'refer'." },
    { phrase: "we provide all real estate services", severity: "block", category: "real-estate", message: "Only probate/senior real estate is performed directly; other services are referred." },
];
let ComplianceService = class ComplianceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeFieldName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    stripBlockedFields(input) {
        const clean = {};
        const blockedFields = [];
        for (const [key, value] of Object.entries(input)) {
            if (constants_1.BLOCKED_FIELD_NAMES.includes(this.normalizeFieldName(key)))
                blockedFields.push(key);
            else
                clean[key] = value;
        }
        return { clean, blockedFields };
    }
    stripFreeText(input) {
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
    looksLikeHealthInfo(text) {
        if (!text)
            return false;
        const t = text.toLowerCase();
        return constants_1.HEALTH_TERM_HINTS.some((h) => t.includes(h));
    }
    async scanText(text) {
        const lower = text.toLowerCase();
        const rules = await this.prisma.complianceRule.findMany({ where: { isActive: true } }).catch(() => []);
        const effective = rules.length > 0 ? rules : FALLBACK_RULES;
        const hits = [];
        for (const r of effective) {
            const idx = lower.indexOf(r.phrase.toLowerCase());
            if (idx !== -1) {
                hits.push({
                    phrase: r.phrase,
                    severity: r.severity ?? "block",
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
    scanContent(post) {
        const composite = [post.title, post.excerpt, post.body, post.socialCaption, post.seoDescription].filter(Boolean).join("\n\n");
        return this.scanText(composite);
    }
    getRules() {
        return this.prisma.complianceRule.findMany({ where: { isActive: true }, orderBy: { category: "asc" } });
    }
    getDisclosures() {
        return this.prisma.disclosureBlock.findMany({ orderBy: { servicePage: "asc" } });
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map