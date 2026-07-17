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
      const appt = payload?.appointment ?? (this.isAppointmentEvent(payload) ? payload : null);
      const contactId = appt?.contactId ?? payload?.contactId ?? payload?.contact?.id;
      if (contactId) {
        const lead = await this.prisma.lead.findFirst({ where: { ghlContactId: String(contactId) } });
        if (lead) {
          // Calendar booking (from the public consultation links) → local Appointment
          // record so it surfaces on the Appointments page and moves the lead forward.
          if (appt) await this.upsertAppointment(lead.id, lead.formName, appt);
          const stage = this.mapStage(payload);
          const nextStage = appt ? "APPOINTMENT_SET" : stage;
          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { ghlSyncStatus: "SYNCED", ghlLastSyncAt: new Date(), ...(nextStage ? { pipelineStage: nextStage } : {}) },
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

  /** True when the GHL event describes a calendar appointment/booking. */
  private isAppointmentEvent(payload: any): boolean {
    const t = String(payload?.type ?? payload?.event ?? "").toLowerCase();
    return t.includes("appointment") || !!payload?.appointment || !!(payload?.startTime && payload?.calendarId);
  }

  /** Map a GHL appointmentStatus string onto our AppointmentStatus enum. */
  private mapAppointmentStatus(raw: any): "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" {
    switch (String(raw ?? "").toLowerCase()) {
      case "cancelled":
      case "canceled":
        return "CANCELLED";
      case "showed":
      case "completed":
        return "COMPLETED";
      case "noshow":
      case "no_show":
      case "no-show":
        return "NO_SHOW";
      default:
        return "SCHEDULED";
    }
  }

  /** Create or update the local Appointment mirror of a GHL calendar booking. */
  private async upsertAppointment(leadId: string, formName: string, appt: any) {
    const ghlId = appt?.id ?? appt?.appointmentId ?? appt?.eventId;
    const start = appt?.startTime ?? appt?.selectedSlot ?? appt?.appointmentTime;
    const scheduledAt = start ? new Date(start) : null;
    if (!scheduledAt || isNaN(scheduledAt.getTime())) return; // no usable time → skip
    const serviceType = String(appt?.title ?? appt?.calendarName ?? formName ?? "Consultation");
    const status = this.mapAppointmentStatus(appt?.appointmentStatus ?? appt?.status);
    const location = appt?.address ?? appt?.location ?? appt?.meetingLocation ?? null;

    if (ghlId) {
      await this.prisma.appointment.upsert({
        where: { ghlAppointmentId: String(ghlId) },
        create: { leadId, serviceType, scheduledAt, status, location, ghlAppointmentId: String(ghlId) },
        update: { scheduledAt, status, location, serviceType },
      });
    } else {
      await this.prisma.appointment.create({ data: { leadId, serviceType, scheduledAt, status, location } });
    }
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
