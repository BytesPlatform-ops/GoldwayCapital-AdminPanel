import { createHmac, timingSafeEqual } from "crypto";
import type { PrismaService } from "@/db/prisma";
import type { AppConfigService } from "@/lib/config";
import type { AuditService } from "@/server/audit";
import { UnauthorizedException } from "@/lib/errors";

export class WebhooksService {
  constructor(private readonly prisma: PrismaService, private readonly config: AppConfigService, private readonly audit: AuditService) {}

  private verify(raw: string, signature?: string | null): boolean {
    if (!this.config.ghl.webhookSecret) return true; // dev: accept; set secret in prod
    if (!signature) return false;
    const digest = createHmac("sha256", this.config.ghl.webhookSecret).update(raw).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async handleGhl(payload: any, signature?: string | null) {
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
    // Scan every vertical's stage map (plus the legacy single-pipeline map).
    const maps = [...Object.values(this.config.ghl.pipelines).map((p) => p.stageIds), this.config.ghl.stageIds];
    for (const stageIds of maps) {
      const match = Object.entries(stageIds).find(([, id]) => id && id === String(stageId));
      if (match) return match[0];
    }
    return null;
  }
}
