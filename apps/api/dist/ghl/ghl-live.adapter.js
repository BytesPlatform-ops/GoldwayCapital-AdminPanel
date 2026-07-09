"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlLiveAdapter = void 0;
class GhlLiveAdapter {
    constructor(config) {
        this.config = config;
        this.isLive = true;
    }
    headers() {
        return {
            Authorization: `Bearer ${this.config.ghl.token}`,
            "Content-Type": "application/json",
            Version: "2021-07-28",
            Accept: "application/json",
        };
    }
    async req(path, method, body) {
        const res = await fetch(`${this.config.ghl.baseUrl}${path}`, {
            method,
            headers: this.headers(),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok)
            throw new Error(`GHL ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 400)}`);
        return (await res.json().catch(() => ({})));
    }
    stageId(stage) {
        return this.config.ghl.stageIds[stage] || "";
    }
    async ping() {
        await this.req(`/locations/${this.config.ghl.locationId}`, "GET");
        return { ok: true, mock: false, detail: "Authenticated against GHL location." };
    }
    async upsertContact(input) {
        const data = await this.req("/contacts/upsert", "POST", {
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
        if (!contactId)
            throw new Error("GHL upsertContact: no id returned");
        return { contactId, mock: false };
    }
    async applyTags(contactId, tags) {
        await this.req(`/contacts/${contactId}/tags`, "POST", { tags });
    }
    async upsertOpportunity(input) {
        const data = await this.req("/opportunities/", "POST", {
            locationId: this.config.ghl.locationId,
            pipelineId: input.pipelineId,
            pipelineStageId: this.stageId(input.stage),
            contactId: input.contactId,
            name: input.name,
            status: "open",
        });
        const opportunityId = data.opportunity?.id ?? data.id;
        if (!opportunityId)
            throw new Error("GHL upsertOpportunity: no id returned");
        return { opportunityId, mock: false };
    }
    async moveOpportunityStage(opportunityId, stage) {
        await this.req(`/opportunities/${opportunityId}`, "PUT", { pipelineStageId: this.stageId(stage) });
    }
    async addContactToWorkflow(contactId, workflowId) {
        await this.req(`/contacts/${contactId}/workflow/${workflowId}`, "POST", {});
    }
    async createTask(input) {
        const data = await this.req(`/contacts/${input.contactId}/tasks`, "POST", {
            title: input.title,
            body: input.body,
            dueDate: input.dueDate,
            completed: false,
        });
        return { id: data.task?.id ?? data.id ?? "", mock: false };
    }
    async createNote(input) {
        const data = await this.req(`/contacts/${input.contactId}/notes`, "POST", { body: input.body });
        return { id: data.note?.id ?? data.id ?? "", mock: false };
    }
}
exports.GhlLiveAdapter = GhlLiveAdapter;
//# sourceMappingURL=ghl-live.adapter.js.map