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
export interface GhlOpportunityInput { contactId: string; pipelineId: string; stage: PipelineStage; name: string }
export interface GhlOpportunityResult { opportunityId: string; mock: boolean }
export interface GhlResultBase { id: string; mock: boolean }

export interface GhlPingResult { ok: boolean; mock: boolean; detail: string }

/** The port every GHL implementation (mock or live) satisfies. */
export interface GhlAdapter {
  readonly isLive: boolean;
  ping(): Promise<GhlPingResult>;
  upsertContact(input: GhlContactInput): Promise<GhlContactResult>;
  applyTags(contactId: string, tags: string[]): Promise<void>;
  upsertOpportunity(input: GhlOpportunityInput): Promise<GhlOpportunityResult>;
  moveOpportunityStage(opportunityId: string, stage: PipelineStage): Promise<void>;
  addContactToWorkflow(contactId: string, workflowId: string): Promise<void>;
  createTask(input: { contactId: string; title: string; body?: string; dueDate?: string }): Promise<GhlResultBase>;
  createNote(input: { contactId: string; body: string }): Promise<GhlResultBase>;
}
