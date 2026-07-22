import { Injectable, Logger } from "@/lib/nest";
import type { Lead, PipelineStage } from "@prisma/client";
import { PrismaService } from "@/db/prisma";
import { AppConfigService } from "@/lib/config";
import { IntegrationLogsService } from "@/server/integration-logs";
import { leadSourceDef } from "@/lib/constants";
import { GhlMockAdapter } from "./ghl-mock.adapter";
import { GhlLiveAdapter } from "./ghl-live.adapter";
import type { GhlAdapter, GhlTask } from "./ghl.types";

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
    const wf = this.config.ghl.workflowIds;
    return {
      enabled: this.config.ghl.enabled,
      mockMode: this.config.ghl.mockMode,
      live: this.config.ghlLive(),
      tokenConfigured: !!this.config.ghl.token,
      locationConfigured: !!this.config.ghl.locationId,
      // Aggregate booleans: every vertical has a pipeline id / all 4 stage ids.
      pipelineConfigured: Object.values(this.config.ghl.pipelines).every((p) => !!p.pipelineId),
      stagesConfigured: Object.values(this.config.ghl.pipelines).every((p) => Object.values(p.stageIds).every((v) => !!v)),
      pipelinesConfigured: Object.fromEntries(Object.entries(this.config.ghl.pipelines).map(([s, p]) => [s, !!p.pipelineId])),
      workflowsConfigured: Object.fromEntries(Object.entries(wf).map(([k, v]) => [k, !!v])),
      assignedUsersConfigured: { owner: !!this.config.ghl.assignedUsers.owner, va: !!this.config.ghl.assignedUsers.va },
    };
  }

  /** Connection test for the Integrations page — mock returns ok, live pings the location. */
  async testConnection(): Promise<{ ok: boolean; live: boolean; detail: string }> {
    const adapter = this.adapter();
    const started = Date.now();
    try {
      const r = await adapter.ping();
      await this.logs.record({ provider: "ghl", operation: "testConnection", status: adapter.isLive ? "success" : "mock", response: { ...r }, durationMs: Date.now() - started });
      return { ok: r.ok, live: adapter.isLive, detail: r.detail };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await this.logs.record({ provider: "ghl", operation: "testConnection", status: "failed", response: { detail }, durationMs: Date.now() - started });
      return { ok: false, live: adapter.isLive, detail };
    }
  }

  /** Sync a throwaway sample contact — proves the write path without persisting a Lead. */
  async testSyncLead(): Promise<{ ok: boolean; live: boolean; contactId?: string; detail: string }> {
    const adapter = this.adapter();
    const started = Date.now();
    try {
      const contact = await this.logs.withRetry(() =>
        adapter.upsertContact({
          firstName: "Goldway",
          lastName: "Integration Test",
          email: "integration-test@goldwaycapital.test",
          phone: null,
          tags: ["Integration-Test"],
          source: "Admin panel connection test",
        })
      );
      await this.logs.record({ provider: "ghl", operation: "testSyncLead", status: contact.mock ? "mock" : "success", response: { contactId: contact.contactId }, durationMs: Date.now() - started });
      return { ok: true, live: adapter.isLive, contactId: contact.contactId, detail: contact.mock ? "Mock contact created (no live request)." : "Test contact upserted in GHL." };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await this.logs.record({ provider: "ghl", operation: "testSyncLead", status: "failed", response: { detail }, durationMs: Date.now() - started });
      return { ok: false, live: adapter.isLive, detail };
    }
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
    const tag = this.config.ghl.tags[lead.leadSource] ?? def.ghlTag;
    const pipeline = this.config.ghlPipelineFor(lead.leadSource);
    const started = Date.now();

    // GHL custom fields (keyed by GHL field key) were computed + stored on intake.
    const submission = await this.prisma.formSubmission.findFirst({
      where: { leadId: lead.id },
      orderBy: { createdAt: "desc" },
      select: { sanitizedPayload: true },
    });
    const snapshot = (submission?.sanitizedPayload ?? {}) as Record<string, unknown>;
    const customFields = (snapshot.ghlCustomFields ?? {}) as Record<string, string | number | boolean | null>;

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
          tags: [tag],
          source: def.label,
          customFields,
        })
      );

      await this.logs.withRetry(() => adapter.applyTags(contact.contactId, [tag]));

      let opportunityId = lead.ghlOpportunityId ?? undefined;
      if (pipeline.pipelineId || !adapter.isLive) {
        const opp = await this.logs.withRetry(() =>
          adapter.upsertOpportunity({
            contactId: contact.contactId,
            pipelineId: pipeline.pipelineId,
            pipelineStageId: pipeline.stageIds[lead.pipelineStage] || "",
            stage: lead.pipelineStage,
            name: `${lead.firstName} ${lead.lastName} — ${def.label}`,
          })
        );
        opportunityId = opp.opportunityId;
      }

      // Enroll the contact into the source-specific confirmation workflow (best-effort).
      const workflowId = this.config.ghl.workflowIds[lead.leadSource];
      if (workflowId) {
        try {
          await this.logs.withRetry(() => adapter.addContactToWorkflow(contact.contactId, workflowId));
          await this.logs.record({ provider: "ghl", operation: "addContactToWorkflow", status: contact.mock ? "mock" : "success", relatedType: "lead", relatedId: lead.id, request: { workflowId } });
        } catch (wfErr) {
          await this.logs.record({ provider: "ghl", operation: "addContactToWorkflow", status: "failed", relatedType: "lead", relatedId: lead.id, request: { workflowId }, response: { error: String(wfErr) } });
        }
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
    const stageId = this.config.ghlPipelineFor(lead.leadSource).stageIds[stage] || "";
    const started = Date.now();
    try {
      await this.logs.withRetry(() => adapter.moveOpportunityStage(lead.ghlOpportunityId!, stageId));
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

  /**
   * Push a follow-up task into GHL for an already-synced lead. Best-effort:
   * returns the GHL task id, or null on any failure so the caller keeps the
   * local task (never-lose-a-lead) and lets the sync retry backfill it later.
   */
  async createTaskForLead(leadId: string, contactId: string, input: { title: string; body?: string; dueDate?: string }): Promise<string | null> {
    const adapter = this.adapter();
    const started = Date.now();
    try {
      const res = await this.logs.withRetry(() => adapter.createTask({ contactId, ...input }));
      await this.logs.record({ provider: "ghl", operation: "createTask", status: res.mock ? "mock" : "success", relatedType: "lead", relatedId: leadId, response: { taskId: res.id }, durationMs: Date.now() - started });
      return res.id || null;
    } catch (err) {
      await this.logs.record({ provider: "ghl", operation: "createTask", status: "failed", relatedType: "lead", relatedId: leadId, response: { error: String(err) }, durationMs: Date.now() - started });
      return null;
    }
  }

  /** Mark a GHL task complete (panel → GHL). Best-effort + logged; returns success. */
  async completeTask(leadId: string, contactId: string, taskId: string): Promise<boolean> {
    const adapter = this.adapter();
    const started = Date.now();
    try {
      await this.logs.withRetry(() => adapter.completeTask(contactId, taskId));
      await this.logs.record({ provider: "ghl", operation: "completeTask", status: adapter.isLive ? "success" : "mock", relatedType: "lead", relatedId: leadId, request: { taskId }, durationMs: Date.now() - started });
      return true;
    } catch (err) {
      await this.logs.record({ provider: "ghl", operation: "completeTask", status: "failed", relatedType: "lead", relatedId: leadId, request: { taskId }, response: { error: String(err) }, durationMs: Date.now() - started });
      return false;
    }
  }

  /** Read-only list of a contact's GHL tasks — powers webhook completion reconciliation. */
  listContactTasks(contactId: string): Promise<GhlTask[]> {
    return this.logs.withRetry(() => this.adapter().listContactTasks(contactId));
  }

  /**
   * Retry all leads in FAILED sync state, then backfill any local tasks that were
   * never pushed to GHL (ghlTaskId null) for leads that DO have a contact id — this
   * recovers tasks whose create failed even though the lead itself synced fine.
   */
  async retryFailed(): Promise<{ retried: number; succeeded: number; tasksPushed: number }> {
    const failed = await this.prisma.lead.findMany({ where: { ghlSyncStatus: "FAILED" }, select: { id: true } });
    let succeeded = 0;
    for (const l of failed) {
      const r = await this.syncLead(l.id);
      if (r && r.ghlSyncStatus !== "FAILED") succeeded++;
    }

    const pending = await this.prisma.followUpTask.findMany({
      where: { ghlTaskId: null, status: "OPEN", lead: { ghlContactId: { not: null } } },
      select: { id: true, title: true, description: true, dueAt: true, leadId: true, lead: { select: { ghlContactId: true } } },
      take: 200,
    });
    let tasksPushed = 0;
    for (const t of pending) {
      const contactId = t.lead?.ghlContactId;
      if (!contactId || !t.leadId) continue;
      const ghlTaskId = await this.createTaskForLead(t.leadId, contactId, {
        title: t.title,
        body: t.description ?? undefined,
        dueDate: t.dueAt ? t.dueAt.toISOString() : undefined,
      });
      if (ghlTaskId) {
        await this.prisma.followUpTask.update({ where: { id: t.id }, data: { ghlTaskId } });
        tasksPushed++;
      }
    }
    return { retried: failed.length, succeeded, tasksPushed };
  }
}
