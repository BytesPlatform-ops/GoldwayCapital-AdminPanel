import { Controller, Get, Injectable, Module, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { GhlService } from "../ghl/ghl.service";
import { WordpressService } from "../wordpress/wordpress.service";
import { SocialService } from "../social/social.service";
import { SocialModule } from "../social/social.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

@Injectable()
class IntegrationsService {
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
        url: `${this.config.wordpress.baseUrl ? "" : ""}${process.env.API_URL ?? "http://localhost:4000"}/webhooks/ghl`,
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("integrations")
class IntegrationsController {
  constructor(
    private readonly svc: IntegrationsService,
    private readonly ghl: GhlService,
    private readonly wordpress: WordpressService,
    private readonly social: SocialService
  ) {}

  @RequirePermissions("integrations.manage") @Get("status")
  status() {
    return this.svc.status();
  }

  @RequirePermissions("integrations.manage") @Post("wordpress/test")
  wpTest() {
    return this.wordpress.testConnection();
  }
  @RequirePermissions("integrations.manage") @Post("wordpress/publish-test-draft")
  wpDraft() {
    return this.wordpress.publishTestDraft();
  }
  @RequirePermissions("integrations.manage") @Post("ghl/test")
  ghlTest() {
    return this.ghl.testConnection();
  }
  @RequirePermissions("integrations.manage") @Post("ghl/sync-test-lead")
  ghlSync() {
    return this.ghl.testSyncLead();
  }
  @RequirePermissions("integrations.manage") @Post("social/test")
  socialTest() {
    return this.social.testConnection();
  }
  @RequirePermissions("integrations.manage") @Post("retry/:logId")
  retry(@Param("logId") logId: string) {
    return this.svc.retry(logId);
  }
}

@Module({ imports: [SocialModule], providers: [IntegrationsService], controllers: [IntegrationsController] })
export class IntegrationsModule {}
