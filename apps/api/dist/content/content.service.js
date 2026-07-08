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
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const compliance_service_1 = require("../compliance/compliance.service");
const social_service_1 = require("../social/social.service");
const audit_service_1 = require("../audit/audit.service");
function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}
let ContentService = class ContentService {
    constructor(prisma, config, compliance, social, audit) {
        this.prisma = prisma;
        this.config = config;
        this.compliance = compliance;
        this.social = social;
        this.audit = audit;
    }
    list() {
        return this.prisma.contentPost.findMany({ orderBy: { updatedAt: "desc" }, take: 100, include: { socialPosts: true } });
    }
    async get(id) {
        const post = await this.prisma.contentPost.findUnique({ where: { id }, include: { socialPosts: true } });
        if (!post)
            throw new common_1.NotFoundException("Content not found");
        return post;
    }
    async create(dto, user) {
        const report = await this.compliance.scanContent(dto);
        const post = await this.prisma.contentPost.create({
            data: {
                title: dto.title,
                body: dto.body,
                excerpt: dto.excerpt,
                category: dto.category,
                featuredImage: dto.featuredImage,
                seoTitle: dto.seoTitle,
                seoDescription: dto.seoDescription,
                socialCaption: dto.socialCaption,
                slug: dto.slug?.trim() || slugify(dto.title),
                status: "DRAFT",
                authorId: user.id,
                medicareSensitive: report.medicareSensitive,
                compliancePassed: report.passed,
                complianceReport: report,
            },
        });
        await this.audit.log({ actorId: user.id, action: "content.created", entityType: "contentPost", entityId: post.id });
        return { post, report };
    }
    async update(id, dto, user) {
        const existing = await this.prisma.contentPost.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException("Content not found");
        const report = await this.compliance.scanContent({ ...existing, ...dto });
        const post = await this.prisma.contentPost.update({
            where: { id },
            data: {
                title: dto.title,
                body: dto.body,
                excerpt: dto.excerpt,
                category: dto.category,
                featuredImage: dto.featuredImage,
                seoTitle: dto.seoTitle,
                seoDescription: dto.seoDescription,
                socialCaption: dto.socialCaption,
                ...(dto.slug ? { slug: slugify(dto.slug) } : {}),
                medicareSensitive: report.medicareSensitive,
                compliancePassed: report.passed,
                complianceReport: report,
            },
        });
        await this.audit.log({ actorId: user.id, action: "content.updated", entityType: "contentPost", entityId: id });
        return { post, report };
    }
    async submitForReview(id, user) {
        await this.prisma.contentPost.update({ where: { id }, data: { status: "NEEDS_REVIEW" } });
        await this.audit.log({ actorId: user.id, action: "content.submitted_for_review", entityType: "contentPost", entityId: id });
        return { ok: true };
    }
    async approve(id, user) {
        const post = await this.get(id);
        const report = await this.compliance.scanContent(post);
        if (!report.passed)
            throw new common_1.BadRequestException("Cannot approve — content has blocking compliance issues.");
        await this.prisma.contentPost.update({ where: { id }, data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date() } });
        await this.audit.log({ actorId: user.id, action: "content.approved", entityType: "contentPost", entityId: id });
        return { ok: true };
    }
    async publish(id, platforms, user) {
        const post = await this.get(id);
        const report = await this.compliance.scanContent(post);
        if (!report.passed)
            throw new common_1.BadRequestException("Blocked: content fails compliance. Fix flagged phrases first.");
        if (this.config.compliance.reviewRequired && post.status !== "APPROVED") {
            throw new common_1.ForbiddenException("Content must be Approved before publishing (review required).");
        }
        const socialResults = platforms?.length ? await this.social.publish(id, platforms, post.socialCaption ?? post.title) : {};
        const updated = await this.prisma.contentPost.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
        await this.audit.log({ actorId: user.id, action: "content.published", entityType: "contentPost", entityId: id, metadata: { platforms, socialResults } });
        return { post: updated, socialResults };
    }
    publishedList() {
        return this.prisma.contentPost.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            select: { id: true, title: true, slug: true, excerpt: true, category: true, featuredImage: true, publishedAt: true },
        });
    }
    async publishedBySlug(slug) {
        const post = await this.prisma.contentPost.findFirst({ where: { slug, status: "PUBLISHED" } });
        if (!post)
            throw new common_1.NotFoundException("Article not found");
        return post;
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        compliance_service_1.ComplianceService,
        social_service_1.SocialService,
        audit_service_1.AuditService])
], ContentService);
//# sourceMappingURL=content.service.js.map