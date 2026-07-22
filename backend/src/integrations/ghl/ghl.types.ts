import type { PipelineStage } from "@prisma/client";

export interface GhlContactInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  tags: string[];
  source?: string | null;
  customFields?: Record<string, string | number | boolean | null>;
}
export interface GhlContactResult { contactId: string; mock: boolean }
export interface GhlOpportunityInput { contactId: string; pipelineId: string; pipelineStageId: string; stage: PipelineStage; name: string }
export interface GhlOpportunityResult { opportunityId: string; mock: boolean }
export interface GhlResultBase { id: string; mock: boolean }

export interface GhlPingResult { ok: boolean; mock: boolean; detail: string }

export type GhlCustomFieldMap = Record<string, string | number | boolean | null>;

// A GHL task as returned by the read API — only the fields we reconcile against.
export interface GhlTask { id: string; title: string; completed: boolean }

// Read-model shapes for the introspection helpers (pipelines/calendars/fields).
export interface GhlPipeline { id: string; name: string; stages: { id: string; name: string }[] }
export interface GhlCalendar { id: string; name: string; slug?: string }
export interface GhlCustomField { id: string; name: string; fieldKey: string; dataType?: string }

/** Raised by the live adapter on any non-2xx response. Never carries the token. */
export class GhlApiError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    readonly body: string
  ) {
    super(`GHL ${method} ${path} → ${status} ${body.slice(0, 300)}`);
    this.name = "GhlApiError";
  }
}

export interface GhlNormalizedError { status: number | null; message: string; detail?: string }

/** Collapse any thrown value into a safe, token-free shape for API responses/logs. */
export function normalizeGhlError(err: unknown): GhlNormalizedError {
  if (err instanceof GhlApiError) {
    let detail = err.body;
    try {
      const parsed = JSON.parse(err.body);
      detail = String(parsed?.message ?? parsed?.error ?? err.body);
    } catch {
      /* body was not JSON — keep the raw text */
    }
    return { status: err.status, message: `GHL request failed (${err.status})`, detail: detail.slice(0, 300) };
  }
  return { status: null, message: err instanceof Error ? err.message : String(err) };
}

/** The port every GHL implementation (mock or live) satisfies. */
export interface GhlAdapter {
  readonly isLive: boolean;
  ping(): Promise<GhlPingResult>;
  upsertContact(input: GhlContactInput): Promise<GhlContactResult>;
  updateContactCustomFields(contactId: string, fields: GhlCustomFieldMap): Promise<void>;
  applyTags(contactId: string, tags: string[]): Promise<void>;
  upsertOpportunity(input: GhlOpportunityInput): Promise<GhlOpportunityResult>;
  moveOpportunityStage(opportunityId: string, pipelineStageId: string): Promise<void>;
  addContactToWorkflow(contactId: string, workflowId: string): Promise<void>;
  createTask(input: { contactId: string; title: string; body?: string; dueDate?: string }): Promise<GhlResultBase>;
  completeTask(contactId: string, taskId: string): Promise<void>;
  listContactTasks(contactId: string): Promise<GhlTask[]>;
  createNote(input: { contactId: string; body: string }): Promise<GhlResultBase>;
  getPipelines(): Promise<GhlPipeline[]>;
  getCalendars(): Promise<GhlCalendar[]>;
  getCustomFields(): Promise<GhlCustomField[]>;
}
