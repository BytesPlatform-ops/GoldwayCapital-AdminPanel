import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@/lib/nest";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "@/db/prisma";
import { AppConfigService } from "@/lib/config";
import { ComplianceService } from "@/server/compliance";
import { SocialService } from "@/integrations/social/social.service";
import { WordpressService } from "@/integrations/wordpress/wordpress.service";
import { AuditService } from "@/server/audit";
import type { AuthUser } from "@/types";
import { CreateContentDto, PublishContentDto, UpdateContentDto } from "./content.dto";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly compliance: ComplianceService,
    private readonly social: SocialService,
    private readonly wordpress: WordpressService,
    private readonly audit: AuditService
  ) {}

  list() {
    return this.prisma.contentPost.findMany({ orderBy: { updatedAt: "desc" }, take: 100, include: { socialPosts: true } });
  }

  async get(id: string) {
    const post = await this.prisma.contentPost.findUnique({ where: { id }, include: { socialPosts: true } });
    if (!post) throw new NotFoundException("Content not found");
    return post;
  }

  async create(dto: CreateContentDto, user: AuthUser) {
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
        complianceReport: report as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.log({ actorId: user.id, action: "content.created", entityType: "contentPost", entityId: post.id });
    return { post, report };
  }

  async update(id: string, dto: UpdateContentDto, user: AuthUser) {
    const existing = await this.prisma.contentPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Content not found");
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
        complianceReport: report as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.log({ actorId: user.id, action: "content.updated", entityType: "contentPost", entityId: id });
    return { post, report };
  }

  async submitForReview(id: string, user: AuthUser) {
    await this.prisma.contentPost.update({ where: { id }, data: { status: "NEEDS_REVIEW" } });
    await this.audit.log({ actorId: user.id, action: "content.submitted_for_review", entityType: "contentPost", entityId: id });
    return { ok: true };
  }

  async approve(id: string, user: AuthUser) {
    const post = await this.get(id);
    const report = await this.compliance.scanContent(post);
    if (!report.passed) throw new BadRequestException("Cannot approve — content has blocking compliance issues.");
    await this.prisma.contentPost.update({ where: { id }, data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date() } });
    await this.audit.log({ actorId: user.id, action: "content.approved", entityType: "contentPost", entityId: id });
    return { ok: true };
  }

  async publish(id: string, dto: PublishContentDto, user: AuthUser) {
    const platforms = dto.platforms ?? [];
    const post = await this.get(id);
    const report = await this.compliance.scanContent(post);
    if (!report.passed) throw new BadRequestException("Blocked: content fails compliance. Fix flagged phrases first.");
    if (this.config.compliance.reviewRequired && post.status !== "APPROVED") {
      throw new ForbiddenException("Content must be Approved before publishing (review required).");
    }

    // The Next.js Resource Center serves PUBLISHED posts directly, so marking
    // PUBLISHED always makes the article live on our own site. Pushing to the
    // client's WordPress site and social fan-out are both optional/additive.
    const wordpressResult = dto.publishToWordpress ? await this.wordpress.publishResourceArticle(id, dto.wordpressStatus) : undefined;
    const socialResults = platforms.length ? await this.social.publish(id, platforms, post.socialCaption ?? post.title) : {};

    const updated = await this.prisma.contentPost.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await this.audit.log({ actorId: user.id, action: "content.published", entityType: "contentPost", entityId: id, metadata: { platforms, socialResults, wordpress: !!dto.publishToWordpress } });
    return { post: updated, socialResults, wordpressResult };
  }

  // Public: published articles for the Next.js Resource Center.
  publishedList() {
    return this.prisma.contentPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, category: true, featuredImage: true, publishedAt: true },
    });
  }
  async publishedBySlug(slug: string) {
    const post = await this.prisma.contentPost.findFirst({ where: { slug, status: "PUBLISHED" } });
    if (!post) throw new NotFoundException("Article not found");
    return post;
  }
}
