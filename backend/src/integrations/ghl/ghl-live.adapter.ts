import type { PipelineStage } from "@prisma/client";
import type { AppConfigService } from "@/lib/config";
import type { GhlAdapter, GhlContactInput, GhlContactResult, GhlOpportunityInput, GhlOpportunityResult, GhlPingResult, GhlResultBase } from "./ghl.types";

/**
 * Live GHL adapter — GoHighLevel API v2 (LeadConnector). Exercised only when
 * config.ghlLive() is true. All request bodies live here so this is the single
 * place to adjust once the real account is connected. Throws on HTTP failure;
 * the sync service wraps calls in retry + logging.
 */
export class GhlLiveAdapter implements GhlAdapter {
  readonly isLive = true;
  constructor(private readonly config: AppConfigService) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.ghl.token}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
      Accept: "application/json",
    };
  }

  private async req<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.config.ghl.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GHL ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 400)}`);
    return (await res.json().catch(() => ({}))) as T;
  }

  private stageId(stage: PipelineStage): string {
    return this.config.ghl.stageIds[stage] || "";
  }

  async ping(): Promise<GhlPingResult> {
    // Fetch the configured location — cheapest authenticated call, no writes.
    await this.req(`/locations/${this.config.ghl.locationId}`, "GET");
    return { ok: true, mock: false, detail: "Authenticated against GHL location." };
  }

  async upsertContact(input: GhlContactInput): Promise<GhlContactResult> {
    const data = await this.req<{ contact?: { id: string }; id?: string }>("/contacts/upsert", "POST", {
      locationId: this.config.ghl.locationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || undefined,
      phone: input.phone || undefined,
      city: input.city || undefined,
      state: input.state || undefined,
      postalCode: input.postalCode || undefined,
      tags: input.tags,
      source: input.source || "Website",
    });
    const contactId = data.contact?.id ?? data.id;
    if (!contactId) throw new Error("GHL upsertContact: no id returned");
    return { contactId, mock: false };
  }

  async applyTags(contactId: string, tags: string[]): Promise<void> {
    await this.req(`/contacts/${contactId}/tags`, "POST", { tags });
  }

  async upsertOpportunity(input: GhlOpportunityInput): Promise<GhlOpportunityResult> {
    const data = await this.req<{ opportunity?: { id: string }; id?: string }>("/opportunities/", "POST", {
      locationId: this.config.ghl.locationId,
      pipelineId: input.pipelineId,
      pipelineStageId: this.stageId(input.stage),
      contactId: input.contactId,
      name: input.name,
      status: "open",
    });
    const opportunityId = data.opportunity?.id ?? data.id;
    if (!opportunityId) throw new Error("GHL upsertOpportunity: no id returned");
    return { opportunityId, mock: false };
  }

  async moveOpportunityStage(opportunityId: string, stage: PipelineStage): Promise<void> {
    await this.req(`/opportunities/${opportunityId}`, "PUT", { pipelineStageId: this.stageId(stage) });
  }

  async addContactToWorkflow(contactId: string, workflowId: string): Promise<void> {
    await this.req(`/contacts/${contactId}/workflow/${workflowId}`, "POST", {});
  }

  async createTask(input: { contactId: string; title: string; body?: string; dueDate?: string }): Promise<GhlResultBase> {
    const data = await this.req<{ id?: string; task?: { id: string } }>(`/contacts/${input.contactId}/tasks`, "POST", {
      title: input.title,
      body: input.body,
      dueDate: input.dueDate,
      completed: false,
    });
    return { id: data.task?.id ?? data.id ?? "", mock: false };
  }

  async createNote(input: { contactId: string; body: string }): Promise<GhlResultBase> {
    const data = await this.req<{ id?: string; note?: { id: string } }>(`/contacts/${input.contactId}/notes`, "POST", { body: input.body });
    return { id: data.note?.id ?? data.id ?? "", mock: false };
  }
}
