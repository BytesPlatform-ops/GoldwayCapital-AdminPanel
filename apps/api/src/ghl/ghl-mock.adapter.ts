import type { GhlAdapter, GhlContactInput, GhlContactResult, GhlOpportunityInput, GhlOpportunityResult, GhlResultBase } from "./ghl.types";

/** Mock GHL — deterministic fake IDs, no network. Used when GHL is off/mock. */
export class GhlMockAdapter implements GhlAdapter {
  readonly isLive = false;

  private id(prefix: string, seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return `mock_${prefix}_${Math.abs(h).toString(36)}`;
  }

  async upsertContact(input: GhlContactInput): Promise<GhlContactResult> {
    return { contactId: this.id("contact", input.email || input.phone || input.firstName + input.lastName), mock: true };
  }
  async applyTags(): Promise<void> {}
  async upsertOpportunity(input: GhlOpportunityInput): Promise<GhlOpportunityResult> {
    return { opportunityId: this.id("opp", input.contactId + input.stage), mock: true };
  }
  async moveOpportunityStage(): Promise<void> {}
  async createTask(input: { contactId: string; title: string }): Promise<GhlResultBase> {
    return { id: this.id("task", input.contactId + input.title), mock: true };
  }
  async createNote(input: { contactId: string }): Promise<GhlResultBase> {
    return { id: this.id("note", input.contactId), mock: true };
  }
}
