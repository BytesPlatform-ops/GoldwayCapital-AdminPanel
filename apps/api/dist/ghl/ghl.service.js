"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const integration_logs_service_1 = require("../integration-logs/integration-logs.service");
const constants_1 = require("../common/constants");
const ghl_mock_adapter_1 = require("./ghl-mock.adapter");
const ghl_live_adapter_1 = require("./ghl-live.adapter");
let GhlService = class GhlService {
    constructor(prisma, config, logs) {
        this.prisma = prisma;
        this.config = config;
        this.logs = logs;
        this.logger = new common_1.Logger("GHL");
    }
    adapter() {
        return this.config.ghlLive() ? new ghl_live_adapter_1.GhlLiveAdapter(this.config) : new ghl_mock_adapter_1.GhlMockAdapter();
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
    async syncLead(leadId) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return null;
        const adapter = this.adapter();
        const def = (0, constants_1.leadSourceDef)(lead.leadSource);
        const started = Date.now();
        try {
            const contact = await this.logs.withRetry(() => adapter.upsertContact({
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
            }));
            await this.logs.withRetry(() => adapter.applyTags(contact.contactId, [def.ghlTag]));
            let opportunityId = lead.ghlOpportunityId ?? undefined;
            if (this.config.ghl.pipelineId || !adapter.isLive) {
                const opp = await this.logs.withRetry(() => adapter.upsertOpportunity({
                    contactId: contact.contactId,
                    pipelineId: this.config.ghl.pipelineId,
                    stage: lead.pipelineStage,
                    name: `${lead.firstName} ${lead.lastName} — ${def.label}`,
                }));
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
        }
        catch (err) {
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
    async syncStage(leadId, stage) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return false;
        if (!lead.ghlOpportunityId) {
            const synced = await this.syncLead(leadId);
            return !!synced && synced.ghlSyncStatus !== "FAILED";
        }
        const adapter = this.adapter();
        const started = Date.now();
        try {
            await this.logs.withRetry(() => adapter.moveOpportunityStage(lead.ghlOpportunityId, stage));
            await this.prisma.lead.update({
                where: { id: leadId },
                data: { ghlSyncStatus: adapter.isLive ? "SYNCED" : "SYNCED_MOCK", ghlLastSyncAt: new Date() },
            });
            await this.logs.record({ provider: "ghl", operation: "moveStage", status: adapter.isLive ? "success" : "mock", relatedType: "lead", relatedId: leadId, request: { stage }, durationMs: Date.now() - started });
            return true;
        }
        catch (err) {
            await this.prisma.lead.update({ where: { id: leadId }, data: { ghlSyncStatus: "FAILED" } });
            await this.logs.record({ provider: "ghl", operation: "moveStage", status: "failed", relatedType: "lead", relatedId: leadId, request: { stage }, response: { error: String(err) }, durationMs: Date.now() - started });
            return false;
        }
    }
    async retryFailed() {
        const failed = await this.prisma.lead.findMany({ where: { ghlSyncStatus: "FAILED" }, select: { id: true } });
        let succeeded = 0;
        for (const l of failed) {
            const r = await this.syncLead(l.id);
            if (r && r.ghlSyncStatus !== "FAILED")
                succeeded++;
        }
        return { retried: failed.length, succeeded };
    }
};
exports.GhlService = GhlService;
exports.GhlService = GhlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        integration_logs_service_1.IntegrationLogsService])
], GhlService);
//# sourceMappingURL=ghl.service.js.map