import { Injectable, Logger } from "@nestjs/common";
import type { Lead, PipelineStage } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { IntegrationLogsService } from "../integration-logs/integration-logs.service";
import { leadSourceDef } from "../common/constants";
import { GhlMockAdapter } from "./ghl-mock.adapter";
import { GhlLiveAdapter } from "./ghl-live.adapter";
import type { GhlAdapter } from "./ghl.types";

@Injectable()
export class GhlService {
  private readonly logger = new Logger("GHL");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly logs: IntegrationLogsService
  ) {}

  /** Picks live vs mock. Missing creds never throw — mock is always available. */
  adapter(): GhlAdapter {
    return this.config.ghlLive() ? new GhlLiveAdapter(this.config) : new GhlMockAdapter();
  }

  status() {
    return {
      enabled: this.config.ghl.enabled,
      mockMode: this.config.ghl.mockMode,
      live: this.config.ghlLive(),
      locationConfigured: !!this.config.ghl.locationId,
      pipelineConfigured: !!this.config.ghl.pipelineId,
    };
  }

  /**
   * Full lead sync: upsert contact → tag → opportunity. Writes the GHL mirror
   * fields back locally. Never throws — a failure marks status FAILED for retry.
   */
  async syncLead(leadId: string): Promise<Lead | null> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return null;
    const adapter = this.adapter();
    const def = leadSourceDef(lead.leadSource);
    const started = Date.now();

    try {
      const contact = await this.logs.withRetry(() =>
        adapter.upsertContact({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          postalCode: lead.zipCode,
          tags: [def.ghlTag],
          source: def.label,
          customFields: {
            service_interest: lead.serviceInterest ?? "",
            form_name: lead.formName,
            consent_given: lead.consentGiven,
            utm_source: lead.utmSource ?? "",
            soa_status: lead.soaStatus,
          },
        })
      );

      await this.logs.withRetry(() => adapter.applyTags(contact.contactId, [def.ghlTag]));

      let opportunityId = lead.ghlOpportunityId ?? undefined;
      if (this.config.ghl.pipelineId || !adapter.isLive) {
        const opp = await this.logs.withRetry(() =>
          adapter.upsertOpportunity({
            contactId: contact.contactId,
            pipelineId: this.config.ghl.pipelineId,
            stage: lead.pipelineStage,
            name: `${lead.firstName} ${lead.lastName} — ${def.label}`,
          })
        );
        opportunityId = opp.opportunityId;
      }

      const updated = await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          ghlContactId: contact.contactId,
          ghlOpportunityId: opportunityId,
          ghlSyncStatus: contact.mock ? "SYNCED_MOCK" : "SYNCED",
          ghlLastSyncAt: new Date(),
        },
      });

      await this.logs.record({
        provider: "ghl",
        operation: "syncLead",
        status: contact.mock ? "mock" : "success",
        relatedType: "lead",
        relatedId: lead.id,
        response: { contactId: contact.contactId, opportunityId },
        durationMs: Date.now() - started,
      });
      return updated;
    } catch (err) {
      await this.prisma.lead.update({ where: { id: lead.id }, data: { ghlSyncStatus: "FAILED", ghlLastSyncAt: new Date() } });
      await this.logs.record({
        provider: "ghl",
        operation: "syncLead",
        status: "failed",
        relatedType: "lead",
        relatedId: lead.id,
        response: { error: err instanceof Error ? err.message : String(err) },
        durationMs: Date.now() - started,
      });
      this.logger.warn(`Lead ${lead.id} GHL sync failed: ${err}`);
      return this.prisma.lead.findUnique({ where: { id: lead.id } });
    }
  }

  /** Push a stage change to the GHL opportunity. Best-effort + logged. */
  async syncStage(leadId: string, stage: PipelineStage): Promise<boolean> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return false;
    if (!lead.ghlOpportunityId) {
      const synced = await this.syncLead(leadId);
      return !!synced && synced.ghlSyncStatus !== "FAILED";
    }
    const adapter = this.adapter();
    const started = Date.now();
    try {
      await this.logs.withRetry(() => adapter.moveOpportunityStage(lead.ghlOpportunityId!, stage));
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { ghlSyncStatus: adapter.isLive ? "SYNCED" : "SYNCED_MOCK", ghlLastSyncAt: new Date() },
      });
      await this.logs.record({ provider: "ghl", operation: "moveStage", status: adapter.isLive ? "success" : "mock", relatedType: "lead", relatedId: leadId, request: { stage }, durationMs: Date.now() - started });
      return true;
    } catch (err) {
      await this.prisma.lead.update({ where: { id: leadId }, data: { ghlSyncStatus: "FAILED" } });
      await this.logs.record({ provider: "ghl", operation: "moveStage", status: "failed", relatedType: "lead", relatedId: leadId, request: { stage }, response: { error: String(err) }, durationMs: Date.now() - started });
      return false;
    }
  }

  /** Retry all leads currently in FAILED sync state. */
  async retryFailed(): Promise<{ retried: number; succeeded: number }> {
    const failed = await this.prisma.lead.findMany({ where: { ghlSyncStatus: "FAILED" }, select: { id: true } });
    let succeeded = 0;
    for (const l of failed) {
      const r = await this.syncLead(l.id);
      if (r && r.ghlSyncStatus !== "FAILED") succeeded++;
    }
    return { retried: failed.length, succeeded };
  }
}
