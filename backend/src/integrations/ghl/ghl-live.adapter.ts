import type { AppConfigService } from "@/lib/config";
import {
  GhlApiError,
  type GhlAdapter,
  type GhlCalendar,
  type GhlContactInput,
  type GhlContactResult,
  type GhlCustomField,
  type GhlCustomFieldMap,
  type GhlOpportunityInput,
  type GhlOpportunityResult,
  type GhlPingResult,
  type GhlPipeline,
  type GhlResultBase,
  type GhlTask,
} from "./ghl.types";

// GHL requires a Version header per endpoint family. Pipelines/contacts/custom
// fields were tested on 2021-07-28; calendars on the v3-generation date header.
const V_DEFAULT = "2021-07-28";
const V_CALENDARS = "2021-04-15";

/**
 * Live GHL adapter — GoHighLevel API v2 (LeadConnector). Exercised only when
 * config.ghlLive() is true. All request bodies live here so this is the single
 * place to adjust once the real account is connected. Throws on HTTP failure;
 * the sync service wraps calls in retry + logging.
 */
export class GhlLiveAdapter implements GhlAdapter {
  readonly isLive = true;
  constructor(private readonly config: AppConfigService) {}

  private headers(version: string): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.ghl.token}`,
      "Content-Type": "application/json",
      Version: version,
      Accept: "application/json",
    };
  }

  private async req<T>(path: string, method: string, body?: unknown, version = V_DEFAULT): Promise<T> {
    const res = await fetch(`${this.config.ghl.baseUrl}${path}`, {
      method,
      headers: this.headers(version),
      body: body ? JSON.stringify(body) : undefined,
    });
    // Read the body safely regardless of status; throw a token-free typed error.
    if (!res.ok) throw new GhlApiError(res.status, method, path, await res.text().catch(() => ""));
    return (await res.json().catch(() => ({}))) as T;
  }

  /** Our payload keys → GHL custom-field ids, from the GHL_CF_*_ID/_KEY env pairs. */
  private customFields(input?: Record<string, string | number | boolean | null>) {
    if (!input) return undefined;
    const fields = Object.entries(input)
      .map(([key, value]) => ({ id: this.config.ghl.customFieldIds[key], key, field_value: String(value ?? "") }))
      .filter((f) => !!f.id);
    return fields.length ? fields : undefined;
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
      customFields: this.customFields(input.customFields),
    });
    const contactId = data.contact?.id ?? data.id;
    if (!contactId) throw new Error("GHL upsertContact: no id returned");
    return { contactId, mock: false };
  }

  async updateContactCustomFields(contactId: string, fields: GhlCustomFieldMap): Promise<void> {
    const customFields = this.customFields(fields);
    if (!customFields) return;
    await this.req(`/contacts/${contactId}`, "PUT", { customFields });
  }

  async applyTags(contactId: string, tags: string[]): Promise<void> {
    await this.req(`/contacts/${contactId}/tags`, "POST", { tags });
  }

  async upsertOpportunity(input: GhlOpportunityInput): Promise<GhlOpportunityResult> {
    try {
      const data = await this.req<{ opportunity?: { id: string }; id?: string }>("/opportunities/", "POST", {
        locationId: this.config.ghl.locationId,
        pipelineId: input.pipelineId,
        pipelineStageId: input.pipelineStageId,
        contactId: input.contactId,
        name: input.name,
        status: "open",
      });
      const opportunityId = data.opportunity?.id ?? data.id;
      if (!opportunityId) throw new Error("GHL upsertOpportunity: no id returned");
      return { opportunityId, mock: false };
    } catch (err) {
      // GHL refuses a second opportunity for a contact that already has one.
      // Reuse the existing opportunity (idempotent re-submits/retries) and move
      // it to the target stage.
      if (err instanceof GhlApiError && err.status === 400) {
        const existingId = (() => {
          try {
            return JSON.parse(err.body)?.meta?.existingId as string | undefined;
          } catch {
            return undefined;
          }
        })();
        if (existingId) {
          if (input.pipelineStageId) {
            await this.req(`/opportunities/${existingId}`, "PUT", { pipelineStageId: input.pipelineStageId }).catch(() => undefined);
          }
          return { opportunityId: String(existingId), mock: false };
        }
      }
      throw err;
    }
  }

  async moveOpportunityStage(opportunityId: string, pipelineStageId: string): Promise<void> {
    await this.req(`/opportunities/${opportunityId}`, "PUT", { pipelineStageId });
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

  /** Mark a GHL task complete. Dedicated endpoint — avoids the update endpoint's
   *  required-field validation (title/dueDate). Best-effort at the call site. */
  async completeTask(contactId: string, taskId: string): Promise<void> {
    await this.req(`/contacts/${contactId}/tasks/${taskId}/completed`, "PUT", { completed: true });
  }

  /** Tasks for one contact (read-only). Powers webhook reconciliation — GHL has no
   *  location-wide task list, so completion sync is always contact-scoped. */
  async listContactTasks(contactId: string): Promise<GhlTask[]> {
    const data = await this.req<{ tasks?: Array<{ id?: string; _id?: string; title?: string; completed?: boolean }> }>(
      `/contacts/${contactId}/tasks`,
      "GET"
    );
    return (data.tasks ?? [])
      .map((t) => ({ id: String(t.id ?? t._id ?? ""), title: t.title ?? "", completed: !!t.completed }))
      .filter((t) => !!t.id);
  }

  async createNote(input: { contactId: string; body: string }): Promise<GhlResultBase> {
    const data = await this.req<{ id?: string; note?: { id: string } }>(`/contacts/${input.contactId}/notes`, "POST", { body: input.body });
    return { id: data.note?.id ?? data.id ?? "", mock: false };
  }

  // ---- Introspection helpers (read-only; used by the Integrations page) ------
  async getPipelines(): Promise<GhlPipeline[]> {
    const data = await this.req<{ pipelines?: Array<{ id: string; name: string; stages?: Array<{ id: string; name: string }> }> }>(
      `/opportunities/pipelines?locationId=${this.config.ghl.locationId}`,
      "GET"
    );
    return (data.pipelines ?? []).map((p) => ({ id: p.id, name: p.name, stages: (p.stages ?? []).map((s) => ({ id: s.id, name: s.name })) }));
  }

  async getCalendars(): Promise<GhlCalendar[]> {
    const data = await this.req<{ calendars?: Array<{ id: string; name: string; slug?: string }> }>(
      `/calendars/?locationId=${this.config.ghl.locationId}`,
      "GET",
      undefined,
      V_CALENDARS
    );
    return (data.calendars ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  }

  async getCustomFields(): Promise<GhlCustomField[]> {
    const data = await this.req<{ customFields?: Array<{ id: string; name: string; fieldKey: string; dataType?: string }> }>(
      `/locations/${this.config.ghl.locationId}/customFields`,
      "GET"
    );
    return (data.customFields ?? []).map((f) => ({ id: f.id, name: f.name, fieldKey: f.fieldKey, dataType: f.dataType }));
  }
}
