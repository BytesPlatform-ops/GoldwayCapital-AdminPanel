import type { PrismaService } from "@/db/prisma";
import type { AppConfigService } from "@/lib/config";
import type { GhlService } from "@/integrations/ghl/ghl.service";
import type { WordpressService } from "@/integrations/wordpress/wordpress.service";
import type { SocialService } from "@/integrations/social/social.service";
import { NotFoundException } from "@/lib/errors";

export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly ghl: GhlService,
    private readonly wordpress: WordpressService,
    private readonly social: SocialService
  ) {}

  private lastLog(provider: string) {
    return this.prisma.integrationLog.findFirst({ where: { provider }, orderBy: { createdAt: "desc" }, select: { status: true, operation: true, createdAt: true } });
  }

  private webhookUrl() {
    const base = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
    return `${base}/api/webhooks/ghl`;
  }

  async status() {
    const [wpLog, ghlLog, socialLog, emailLog, lastWebhook, failedCount] = await Promise.all([
      this.lastLog("wordpress"),
      this.lastLog("ghl"),
      this.lastLog("social"),
      this.lastLog("email"),
      this.prisma.webhookEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { eventType: true, processed: true, createdAt: true } }),
      this.prisma.integrationLog.count({ where: { status: "failed" } }),
    ]);
    return {
      wordpress: { ...this.wordpress.status(), lastLog: wpLog },
      ghl: { ...this.ghl.status(), lastLog: ghlLog },
      social: { ...this.social.status(), lastLog: socialLog },
      email: { provider: this.config.email.provider, sharedMailbox: this.config.email.sharedMailbox, lastLog: emailLog },
      webhooks: {
        url: this.webhookUrl(),
        secretConfigured: !!this.config.ghl.webhookSecret,
        last: lastWebhook,
      },
      failedCount,
    };
  }

  /** Retry a failed integration log by dispatching on its provider + related entity. */
  async retry(logId: string) {
    const log = await this.prisma.integrationLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException("Integration log not found");

    if (log.provider === "ghl" && log.relatedType === "lead" && log.relatedId) {
      const lead = await this.ghl.syncLead(log.relatedId);
      return { ok: !!lead && lead.ghlSyncStatus !== "FAILED", provider: "ghl" };
    }
    if (log.provider === "wordpress" && log.relatedType === "contentPost" && log.relatedId) {
      const r = await this.wordpress.publishResourceArticle(log.relatedId);
      return { ok: r.ok, provider: "wordpress" };
    }
    if (log.provider === "social" && log.relatedType === "contentPost" && log.relatedId) {
      const failed = await this.prisma.socialPost.findMany({ where: { contentPostId: log.relatedId, status: "FAILED" } });
      const results = await Promise.all(failed.map((sp) => this.social.retry(sp.id)));
      return { ok: results.every((r) => r.ok), provider: "social", retried: results.length };
    }
    return { ok: false, provider: log.provider, detail: "This log type cannot be retried automatically." };
  }
}
