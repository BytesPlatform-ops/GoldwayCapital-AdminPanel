"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlMockAdapter = void 0;
class GhlMockAdapter {
    constructor() {
        this.isLive = false;
    }
    id(prefix, seed) {
        let h = 0;
        for (let i = 0; i < seed.length; i++)
            h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
        return `mock_${prefix}_${Math.abs(h).toString(36)}`;
    }
    async upsertContact(input) {
        return { contactId: this.id("contact", input.email || input.phone || input.firstName + input.lastName), mock: true };
    }
    async applyTags() { }
    async upsertOpportunity(input) {
        return { opportunityId: this.id("opp", input.contactId + input.stage), mock: true };
    }
    async moveOpportunityStage() { }
    async createTask(input) {
        return { id: this.id("task", input.contactId + input.title), mock: true };
    }
    async createNote(input) {
        return { id: this.id("note", input.contactId), mock: true };
    }
}
exports.GhlMockAdapter = GhlMockAdapter;
//# sourceMappingURL=ghl-mock.adapter.js.map