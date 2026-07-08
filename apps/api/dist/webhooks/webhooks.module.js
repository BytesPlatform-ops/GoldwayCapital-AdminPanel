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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const audit_service_1 = require("../audit/audit.service");
let WebhooksService = class WebhooksService {
    constructor(prisma, config, audit) {
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
    }
    verify(raw, signature) {
        if (!this.config.ghl.webhookSecret)
            return true;
        if (!signature)
            return false;
        const digest = (0, crypto_1.createHmac)("sha256", this.config.ghl.webhookSecret).update(raw).digest("hex");
        try {
            return (0, crypto_1.timingSafeEqual)(Buffer.from(digest), Buffer.from(signature));
        }
        catch {
            return false;
        }
    }
    async handleGhl(payload, signature) {
        const raw = JSON.stringify(payload ?? {});
        const valid = this.verify(raw, signature);
        const event = await this.prisma.webhookEvent.create({
            data: { provider: "ghl", eventType: String(payload?.type ?? payload?.event ?? "unknown"), payload, signatureValid: valid, processed: false },
        });
        if (!valid)
            throw new common_1.UnauthorizedException("Invalid webhook signature");
        try {
            const contactId = payload?.contactId ?? payload?.contact?.id;
            if (contactId) {
                const lead = await this.prisma.lead.findFirst({ where: { ghlContactId: String(contactId) } });
                if (lead) {
                    const stage = this.mapStage(payload);
                    await this.prisma.lead.update({
                        where: { id: lead.id },
                        data: { ghlSyncStatus: "SYNCED", ghlLastSyncAt: new Date(), ...(stage ? { pipelineStage: stage } : {}) },
                    });
                }
            }
            await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processed: true } });
            await this.audit.log({ action: "ghl.webhook_received", entityType: "webhook", entityId: event.id, metadata: { type: event.eventType } });
        }
        catch (err) {
            await this.prisma.webhookEvent.update({ where: { id: event.id }, data: { processingError: String(err) } });
        }
        return { ok: true };
    }
    mapStage(payload) {
        const stageId = payload?.pipelineStageId ?? payload?.opportunity?.pipelineStageId;
        if (!stageId)
            return null;
        const match = Object.entries(this.config.ghl.stageIds).find(([, id]) => id && id === String(stageId));
        return match ? match[0] : null;
    }
};
WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, app_config_service_1.AppConfigService, audit_service_1.AuditService])
], WebhooksService);
let WebhooksController = class WebhooksController {
    constructor(svc) {
        this.svc = svc;
    }
    ghl(body, sig) {
        return this.svc.handleGhl(body, sig);
    }
};
__decorate([
    (0, common_1.Post)("ghl"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)("x-ghl-signature")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "ghl", null);
WebhooksController = __decorate([
    (0, common_1.Controller)("webhooks"),
    __metadata("design:paramtypes", [WebhooksService])
], WebhooksController);
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({ providers: [WebhooksService], controllers: [WebhooksController] })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map