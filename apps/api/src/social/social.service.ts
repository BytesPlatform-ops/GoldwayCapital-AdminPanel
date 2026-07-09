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
      // Live path — GHL Social Planner. One platform failing must not fail the batch.
      try {
        const res = await this.ghlSocialPost(platform, caption, scheduledAt);
        externalId = res.externalId;
        status = scheduledAt ? "SCHEDULED" : "PUBLISHED";
      } catch (err) {
        status = "FAILED";
        error = err instanceof Error ? err.message : String(err);
      }
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

  /** Status snapshot for the Integrations page. */
  status() {
    const a = this.config.social.accountIds;
    return {
      enabled: this.config.social.enabled,
      mockMode: this.config.social.mockMode,
      live: this.config.socialLive(),
      ghlPlanner: this.config.social.ghlPlanner,
      accountsConfigured: { FACEBOOK: !!a.FACEBOOK, INSTAGRAM: !!a.INSTAGRAM, LINKEDIN: !!a.LINKEDIN },
      googleBusinessProfileConfigured: !!this.config.social.googleBusinessProfileId,
    };
  }

  /** Connection test for the Integrations page: mock returns ok; live checks creds + accounts. */
  async testConnection(): Promise<{ ok: boolean; live: boolean; detail: string }> {
    const live = this.config.socialLive();
    const started = Date.now();
    if (!live) {
      await this.logs.record({ provider: "social", operation: "testConnection", status: "mock", durationMs: Date.now() - started });
      return { ok: true, live: false, detail: "Social publishing running in mock mode — no live request made." };
    }
    const configured = Object.values(this.config.social.accountIds).some(Boolean);
    const detail = configured
      ? "GHL token + location present and at least one social account id configured."
      : "Live enabled but no social account ids configured — connect accounts in GHL and set their ids.";
    await this.logs.record({ provider: "social", operation: "testConnection", status: configured ? "success" : "failed", response: { detail }, durationMs: Date.now() - started });
    return { ok: configured, live: true, detail };
  }

  /** POST a single post to GHL Social Planner for one connected account. */
  private async ghlSocialPost(platform: SocialPlatform, caption: string, scheduledAt?: string): Promise<{ externalId: string }> {
    const accountId = this.config.social.accountIds[platform];
    if (!accountId) throw new Error(`No connected ${platform} account id configured.`);
    const { baseUrl, token, locationId } = this.config.ghl;
    const res = await fetch(`${baseUrl}/social-media-posting/${locationId}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Version: "2021-07-28", Accept: "application/json" },
      body: JSON.stringify({
        accountIds: [accountId],
        summary: caption,
        type: scheduledAt ? "post" : "post",
        ...(scheduledAt ? { scheduleDate: scheduledAt } : {}),
      }),
    });
    if (!res.ok) throw new Error(`GHL social post ${platform} → ${res.status} ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json().catch(() => ({}))) as { id?: string; post?: { id?: string } };
    return { externalId: data.post?.id ?? data.id ?? `ghl_${platform.toLowerCase()}` };
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
