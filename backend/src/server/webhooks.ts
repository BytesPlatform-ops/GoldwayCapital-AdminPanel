import { createHmac, timingSafeEqual } from "crypto";
import type { PrismaService } from "@/db/prisma";
import type { AppConfigService } from "@/lib/config";
import type { AuditService } from "@/server/audit";
import { UnauthorizedException } from "@/lib/errors";

export interface WebhookAuth {
  signature?: string | null; // HMAC signature header (x-ghl-signature)
  secret?: string | null; // shared secret header/query fallback
}

export class WebhooksService {
  constructor(private readonly prisma: PrismaService, private readonly config: AppConfigService, private readonly audit: AuditService) {}

  private signatureMatches(raw: string, signature?: string | null): boolean {
    const secret = this.config.ghl.webhookSecret;
    if (!secret || !signature) return false;
    const digest = createHmac("sha256", secret).update(raw).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Authenticate a webhook. Fail-closed in production: a secret MUST be
   * configured and either the HMAC signature or the shared secret must match.
   * In non-production with no secret set, accept (local testing only).
   */
  private authenticate(raw: string, auth: WebhookAuth): boolean {
    const secret = this.config.ghl.webhookSecret;
    if (!secret) return process.env.NODE_ENV !== "production";
    if (this.signatureMatches(raw, auth.signature)) return true;
    if (auth.secret) {
      try {
        return timingSafeEqual(Buffer.from(auth.secret), Buffer.from(secret));
      } catch {
        return false;
      }
    }
    return false;
  }

  /** Stable idempotency key for a GHL webhook payload. */
  private eventKey(payload: any): string | null {
    const id = payload?.webhookId ?? payload?.id ?? payload?.eventId;
    return id ? String(id) : null;
  }

  async handleGhl(payload: any, auth: WebhookAuth) {
    const raw = JSON.stringify(payload ?? {});
    const valid = this.authenticate(raw, auth);

    // Idempotency: if we already processed this GHL event id, skip re-processing.
    const key = this.eventKey(payload);
    if (valid && key) {
      const seen = await this.prisma.webhookEvent.findFirst({
        where: { provider: "ghl", processed: true, payload: { path: ["id"], equals: key } },
        select: { id: true },
      });
      if (seen) return { ok: true, deduped: true };
    }

    const event = await this.prisma.webhookEvent.create({
      data: { provider: "ghl", eventType: String(payload?.type ?? payload?.event ?? "unknown"), payload, signatureValid: valid, processed: false },
    });
    if (!valid) throw new UnauthorizedException("Invalid or missing webhook authentication");

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
