import { createHmac, timingSafeEqual } from "crypto";
import type { PrismaService } from "@/db/prisma";
import type { AppConfigService } from "@/lib/config";
import type { AuditService } from "@/server/audit";
import { UnauthorizedException } from "@/lib/errors";
import { parseGhlAppointment, isGhlAppointmentEvent, type ParsedGhlAppointment } from "./ghl-webhook-parser";

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

  /**
   * A human-readable event type for the WebhookEvent row. Real GHL booking
   * payloads carry no `type`/`event` field, so label them from their shape
   * rather than the opaque "unknown".
   */
  private eventType(payload: any): string {
    return String(payload?.type ?? payload?.event ?? (isGhlAppointmentEvent(payload) ? "appointment.booked" : "unknown"));
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
      data: { provider: "ghl", eventType: this.eventType(payload), payload, signatureValid: valid, processed: false },
    });
    if (!valid) throw new UnauthorizedException("Invalid or missing webhook authentication");

    try {
      const appt = parseGhlAppointment(payload);
      const contactId = appt?.contactId ?? payload?.contact_id ?? payload?.contactId ?? payload?.contact?.id ?? null;
      const email = typeof payload?.email === "string" && payload.email.trim() ? payload.email.trim() : null;

      let lead = contactId
        ? await this.prisma.lead.findFirst({ where: { ghlContactId: String(contactId) } })
        : null;

      // (B) Secondary match on email when the contact id resolved no lead — recovers
      // bookings whose GHL contact id drifted from what we synced. Plus-addressed
      // emails are distinct strings, so this never conflates separate contacts.
      if (!lead && email) {
        lead = await this.prisma.lead.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
        });
        // Backfill the GHL contact id so future events for this lead match directly —
        // but only when the lead has none, never overwriting an existing mapping.
        if (lead && contactId && !lead.ghlContactId) {
          await this.prisma.lead.update({ where: { id: lead.id }, data: { ghlContactId: String(contactId) } });
        }
      }

      if (lead) {
        // Calendar booking (from the public consultation links) → local Appointment
        // record so it surfaces on the Appointments page and moves the lead forward.
        if (appt) await this.upsertAppointment(lead, appt);
        const nextStage = appt ? "APPOINTMENT_SET" : this.mapStage(payload);
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { ghlSyncStatus: "SYNCED", ghlLastSyncAt: new Date(), ...(nextStage ? { pipelineStage: nextStage } : {}) },
        });
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processed: true } });
        await this.audit.log({ action: "ghl.webhook_received", entityType: "webhook", entityId: event.id, metadata: { type: event.eventType } });
      } else if (appt) {
        // (C) A real booking we could not tie to any lead (neither contact id nor
        // email matched). Do NOT silently mark it processed — that is exactly what
        // hid the original bug. Leave a visible trace on the event + an audit warning.
        const trace = `unlinked_appointment: no lead matched contactId=${contactId ?? "∅"} email=${email ?? "∅"}`;
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processingError: trace } });
        await this.audit.log({
          action: "ghl.webhook_unlinked_appointment",
          entityType: "webhook",
          entityId: event.id,
          metadata: { type: event.eventType, contactId: contactId ?? null },
        });
      } else {
        // Non-appointment event with no lead to act on — nothing to mirror.
        await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processed: true } });
        await this.audit.log({ action: "ghl.webhook_received", entityType: "webhook", entityId: event.id, metadata: { type: event.eventType } });
      }
    } catch (err) {
      await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processingError: String(err) } });
    }
    return { ok: true };
  }

  /** Create or update the local Appointment mirror of a GHL calendar booking. */
  private async upsertAppointment(lead: { id: string; formName: string }, appt: ParsedGhlAppointment) {
    if (!appt.scheduledAt) return; // no usable time → skip
    // calendar.calendarName drives the service; fall back to the lead's originating form.
    const serviceType = appt.serviceName ?? lead.formName ?? "Consultation";
    const base = { scheduledAt: appt.scheduledAt, status: appt.status, location: appt.location, serviceType };

    if (appt.ghlAppointmentId) {
      await this.prisma.appointment.upsert({
        where: { ghlAppointmentId: appt.ghlAppointmentId },
        create: { leadId: lead.id, ...base, ghlAppointmentId: appt.ghlAppointmentId },
        update: base,
      });
    } else {
      await this.prisma.appointment.create({ data: { leadId: lead.id, ...base } });
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
