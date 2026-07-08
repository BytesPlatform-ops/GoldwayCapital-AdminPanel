import { Injectable } from "@nestjs/common";
import type { SocialPlatform, SocialPostStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { IntegrationLogsService } from "../integration-logs/integration-logs.service";

/**
 * Social publishing abstraction. MVP records a SocialPost per platform and marks
 * it mock-published when credentials are missing. Real publishing (GHL Social
 * Planner / direct APIs) plugs into publishOne() later.
 */
@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly logs: IntegrationLogsService
  ) {}

  async publish(contentPostId: string, platforms: SocialPlatform[], caption: string, scheduledAt?: string) {
    const results: Record<string, SocialPostStatus> = {};
    for (const platform of platforms) {
      results[platform] = await this.publishOne(contentPostId, platform, caption, scheduledAt);
    }
    return results;
  }

  private async publishOne(contentPostId: string, platform: SocialPlatform, caption: string, scheduledAt?: string): Promise<SocialPostStatus> {
    const started = Date.now();
    const live = this.config.socialLive();

    let status: SocialPostStatus;
    let externalId: string | null = null;
    let error: string | null = null;

    if (!live) {
      status = scheduledAt ? "SCHEDULED" : "PUBLISHED";
      externalId = `mock_${platform.toLowerCase()}_${Date.now().toString(36)}`;
    } else {
      // Live path (GHL Social Planner / direct API) not yet configured for this account.
      status = "FAILED";
      error = "Live social publishing not yet configured for this account.";
    }

    await this.upsert(contentPostId, platform, caption, status, externalId, error, scheduledAt);
    await this.logs.record({
      provider: "social",
      operation: `publish:${platform}`,
      status: live ? (status === "FAILED" ? "failed" : "success") : "mock",
      relatedType: "contentPost",
      relatedId: contentPostId,
      request: { platform, scheduled: !!scheduledAt },
      response: { status, error },
      durationMs: Date.now() - started,
    });
    return status;
  }

  async retry(socialPostId: string) {
    const sp = await this.prisma.socialPost.findUnique({ where: { id: socialPostId } });
    if (!sp) return { ok: false };
    const [status] = Object.values(await this.publish(sp.contentPostId, [sp.platform], sp.caption ?? "", sp.scheduledAt?.toISOString()));
    return { ok: status !== "FAILED", status };
  }

  private async upsert(
    contentPostId: string,
    platform: SocialPlatform,
    caption: string,
    status: SocialPostStatus,
    externalId: string | null,
    error: string | null,
    scheduledAt?: string
  ) {
    const existing = await this.prisma.socialPost.findFirst({ where: { contentPostId, platform } });
    const data = {
      caption,
      status,
      externalId,
      error,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    };
    if (existing) await this.prisma.socialPost.update({ where: { id: existing.id }, data });
    else await this.prisma.socialPost.create({ data: { contentPostId, platform, ...data } });
  }
}
