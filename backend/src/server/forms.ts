import { BadRequestException, Injectable } from "@/lib/nest";
import type { LeadSource, Prisma } from "@prisma/client";
import { PrismaService } from "@/db/prisma";
import { AppConfigService } from "@/lib/config";
import { ComplianceService } from "@/server/compliance";
import { GhlService } from "@/integrations/ghl/ghl.service";
import { EmailService } from "@/integrations/email/email.service";
import { AuditService } from "@/server/audit";
import { leadSourceDef } from "@/lib/constants";
import { buildGhlCustomFields, normalizeYesNo, pickFormAnswers } from "@/lib/lead-forms";
import { validateLeadSubmission } from "@/lib/lead-validation";
import { CreateLeadDto } from "./dto/create-lead.dto";

export interface IntakeResult {
  ok: boolean;
  leadId?: string;
  ghlContactId?: string | null;
  ghlOpportunityId?: string | null;
  ghlSyncStatus?: string;
  blockedFields: string[];
  message: string;
}

export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly compliance: ComplianceService,
    private readonly ghl: GhlService,
    private readonly email: EmailService,
    private readonly audit: AuditService
  ) {}

  /**
   * The full lead-capture pipeline:
   * sanitize health fields → (medicare) strip free text → validate (done by pipe/DTO)
   * → save FormSubmission → create Lead → GHL sync → confirmation email → audit + logs.
   * Never loses a lead: GHL/email failures do not roll back the local save.
   */
  async intake(
    source: LeadSource,
    dto: CreateLeadDto,
    rawBody: Record<string, unknown>,
    ctx: { ip?: string | null; userAgent?: string | null }
  ): Promise<IntakeResult> {
    // Honeypot tripped → accept silently, drop.
    if (dto.website && dto.website.length > 0) return { ok: true, blockedFields: [], message: "ok" };

    // Validate required fields + formats (throws BadRequestException → 400).
    validateLeadSubmission(source, rawBody);

    // 1. Strip health/coverage fields from the RAW body (defense in depth; the DTO
    //    whitelist already dropped unknown keys, but we scan the raw body so we can
    //    report exactly which health fields the site tried to send).
    let blockedFields: string[] = [];
    if (this.config.compliance.blockHealthFields) {
      blockedFields = this.compliance.stripBlockedFields(rawBody).blockedFields;
    }

    const def = leadSourceDef(source);
    const now = new Date();
    const nowIso = now.toISOString();

    if (!dto.email && !dto.phone) throw new BadRequestException("Provide at least an email or a phone number.");

    // 2a. Whitelisted vertical answers + server-owned hidden/consent fields.
    const answers = pickFormAnswers(source, rawBody);
    const emailConsent = normalizeYesNo(rawBody.emailConsent ?? dto.consentGiven);
    const smsConsent = normalizeYesNo(rawBody.smsConsent);
    const consentGiven = emailConsent === "Yes" || smsConsent === "Yes" || !!dto.consentGiven;
    const tcpaConsentTimestamp =
      (typeof rawBody.tcpaConsentTimestamp === "string" && rawBody.tcpaConsentTimestamp) ||
      (consentGiven ? nowIso : "");
    const hidden = {
      leadSource: def.label,
      campaign: String(rawBody.campaign ?? dto.utmCampaign ?? ""),
      landingPageUrl: dto.sourcePageUrl ?? String(rawBody.landingPageUrl ?? ""),
      submissionDateTime: nowIso,
      bestTimeToCall: String(rawBody.bestTimeToCall ?? ""),
      emailConsent,
      smsConsent,
      tcpaConsentTimestamp,
    };
    // Ready-to-send GHL custom fields (keyed by GHL field key). Only whitelisted
    // keys survive — health/coverage fields never reach here.
    const ghlCustomFields = buildGhlCustomFields(source, { ...answers, ...hidden });

    // 2b. Persist the sanitized submission snapshot (names only for blocked fields).
    const snapshot: Prisma.InputJsonValue = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      zipCode: dto.zipCode ?? null,
      preferredContactMethod: dto.preferredContactMethod ?? null,
      preferredContactTime: dto.preferredContactTime ?? null,
      serviceInterest: dto.serviceInterest ?? null,
      consentGiven,
      emailConsent,
      smsConsent,
      tcpaConsentTimestamp,
      utmSource: dto.utmSource ?? null,
      utmMedium: dto.utmMedium ?? null,
      utmCampaign: dto.utmCampaign ?? null,
      formAnswers: answers as Prisma.InputJsonValue,
      hidden: hidden as Prisma.InputJsonValue,
      // The exact payload GHL will receive as custom fields (audit + resync source).
      ghlCustomFields: ghlCustomFields as Prisma.InputJsonValue,
    };

    const submission = await this.prisma.formSubmission.create({
      data: {
        leadSource: source,
        formName: def.formName,
        sanitizedPayload: snapshot,
        blockedFields,
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        sourcePageUrl: dto.sourcePageUrl ?? null,
      },
    });

    // 3. Create the Lead (contact + scheduling only).
    const lead = await this.prisma.lead.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        zipCode: dto.zipCode ?? null,
        serviceInterest: dto.serviceInterest ?? def.serviceInterest,
        leadSource: source,
        formName: def.formName,
        pipelineStage: "NEW",
        ghlSyncStatus: "PENDING",
        consentGiven,
        consentTimestamp: consentGiven ? now : null,
        preferredContactMethod: dto.preferredContactMethod ?? null,
        preferredContactTime: dto.preferredContactTime ?? null,
        sourcePageUrl: dto.sourcePageUrl ?? null,
        utmSource: dto.utmSource ?? null,
        utmMedium: dto.utmMedium ?? null,
        utmCampaign: dto.utmCampaign ?? null,
        soaRequired: def.isMedicare,
        soaStatus: def.isMedicare ? "REQUIRED" : "NOT_REQUIRED",
        recruitingStatus: def.isRecruiting ? "NEW" : null,
      },
    });

    await this.prisma.formSubmission.update({ where: { id: submission.id }, data: { leadId: lead.id } });

    await this.audit.log({ action: "form.submitted", entityType: "lead", entityId: lead.id, metadata: { source, blockedFields }, ipAddress: ctx.ip });
    await this.audit.log({ action: "lead.created", entityType: "lead", entityId: lead.id });

    // 4. GHL sync + confirmation email (best-effort, never block the response).
    //    Email is sent only when the lead consented to email contact.
    const synced = await this.ghl.syncLead(lead.id).catch(() => undefined);
    if (dto.email && emailConsent === "Yes") {
      await this.email.sendConfirmation(lead.id, source, dto.email, dto.firstName).catch(() => undefined);
    }

    return {
      ok: true,
      leadId: lead.id,
      ghlContactId: synced?.ghlContactId ?? null,
      ghlOpportunityId: synced?.ghlOpportunityId ?? null,
      ghlSyncStatus: synced?.ghlSyncStatus ?? lead.ghlSyncStatus,
      blockedFields,
      message: "Lead received.",
    };
  }
}
