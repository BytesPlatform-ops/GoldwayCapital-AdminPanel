import { Body, Controller, Headers, HttpCode, Injectable, Module, Post, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
class WebhooksService {
  constructor(private readonly prisma: PrismaService, private readonly config: AppConfigService, private readonly audit: AuditService) {}

  private verify(raw: string, signature?: string): boolean {
    if (!this.config.ghl.webhookSecret) return true; // dev: accept; set secret in prod
    if (!signature) return false;
    const digest = createHmac("sha256", this.config.ghl.webhookSecret).update(raw).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async handleGhl(payload: any, signature?: string) {
    const raw = JSON.stringify(payload ?? {});
    const valid = this.verify(raw, signature);
    const event = await this.prisma.webhookEvent.create({
      data: { provider: "ghl", eventType: String(payload?.type ?? payload?.event ?? "unknown"), payload, signatureValid: valid, processed: false },
    });
    if (!valid) throw new UnauthorizedException("Invalid webhook signature");

    try {
      const contactId = payload?.contactId ?? payload?.contact?.id;
      if (contactId) {
        const lead = await this.prisma.lead.findFirst({ where: { ghlContactId: String(contactId) } });
        if (lead) {
          const stage = this.mapStage(payload);
          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { ghlSyncStatus: "SYNCED", ghlLastSyncAt: new Date(), ...(stage ? { pipelineStage: stage } : {}) },
          });
        }
      }
      await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processed: true } });
      await this.audit.log({ action: "ghl.webhook_received", entityType: "webhook", entityId: event.id, metadata: { type: event.eventType } });
    } catch (err) {
      await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processingError: String(err) } });
    }
    return { ok: true };
  }

  private mapStage(payload: any): any {
    const stageId = payload?.pipelineStageId ?? payload?.opportunity?.pipelineStageId;
    if (!stageId) return null;
    const match = Object.entries(this.config.ghl.stageIds).find(([, id]) => id && id === String(stageId));
    return match ? match[0] : null;
  }
}

@Controller("webhooks")
class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}
  @Post("ghl") @HttpCode(200)
  ghl(@Body() body: any, @Headers("x-ghl-signature") sig?: string) {
    return this.svc.handleGhl(body, sig);
  }
}

@Module({ providers: [WebhooksService], controllers: [WebhooksController] })
export class WebhooksModule {}
