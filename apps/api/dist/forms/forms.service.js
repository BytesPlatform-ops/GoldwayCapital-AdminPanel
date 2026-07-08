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
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const compliance_service_1 = require("../compliance/compliance.service");
const ghl_service_1 = require("../ghl/ghl.service");
const email_service_1 = require("../email/email.service");
const audit_service_1 = require("../audit/audit.service");
const constants_1 = require("../common/constants");
let FormsService = class FormsService {
    constructor(prisma, config, compliance, ghl, email, audit) {
        this.prisma = prisma;
        this.config = config;
        this.compliance = compliance;
        this.ghl = ghl;
        this.email = email;
        this.audit = audit;
    }
    async intake(source, dto, rawBody, ctx) {
        if (dto.website && dto.website.length > 0)
            return { ok: true, blockedFields: [], message: "ok" };
        let blockedFields = [];
        if (this.config.compliance.blockHealthFields) {
            blockedFields = this.compliance.stripBlockedFields(rawBody).blockedFields;
        }
        const def = (0, constants_1.leadSourceDef)(source);
        const now = new Date();
        const snapshot = {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email ?? null,
            phone: dto.phone ?? null,
            city: dto.city ?? null,
            state: dto.state ?? null,
            zipCode: dto.zipCode ?? null,
            preferredContactMethod: dto.preferredContactMethod ?? null,
            preferredContactTime: dto.preferredContactTime ?? null,
            serviceInterest: dto.serviceInterest ?? null,
            consentGiven: !!dto.consentGiven,
            utmSource: dto.utmSource ?? null,
            utmMedium: dto.utmMedium ?? null,
            utmCampaign: dto.utmCampaign ?? null,
        };
        if (!dto.email && !dto.phone)
            throw new common_1.BadRequestException("Provide at least an email or a phone number.");
        const submission = await this.prisma.formSubmission.create({
            data: {
                leadSource: source,
                formName: def.formName,
                sanitizedPayload: snapshot,
                blockedFields,
                ipAddress: ctx.ip ?? null,
                userAgent: ctx.userAgent ?? null,
                sourcePageUrl: dto.sourcePageUrl ?? null,
            },
        });
        const lead = await this.prisma.lead.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email ?? null,
                phone: dto.phone ?? null,
                city: dto.city ?? null,
                state: dto.state ?? null,
                zipCode: dto.zipCode ?? null,
                serviceInterest: dto.serviceInterest ?? def.serviceInterest,
                leadSource: source,
                formName: def.formName,
                pipelineStage: "NEW",
                ghlSyncStatus: "PENDING",
                consentGiven: !!dto.consentGiven,
                consentTimestamp: dto.consentGiven ? now : null,
                preferredContactMethod: dto.preferredContactMethod ?? null,
                preferredContactTime: dto.preferredContactTime ?? null,
                sourcePageUrl: dto.sourcePageUrl ?? null,
                utmSource: dto.utmSource ?? null,
                utmMedium: dto.utmMedium ?? null,
                utmCampaign: dto.utmCampaign ?? null,
                soaRequired: def.isMedicare,
                soaStatus: def.isMedicare ? "REQUIRED" : "NOT_REQUIRED",
                recruitingStatus: def.isRecruiting ? "NEW" : null,
            },
        });
        await this.prisma.formSubmission.update({ where: { id: submission.id }, data: { leadId: lead.id } });
        await this.audit.log({ action: "form.submitted", entityType: "lead", entityId: lead.id, metadata: { source, blockedFields }, ipAddress: ctx.ip });
        await this.audit.log({ action: "lead.created", entityType: "lead", entityId: lead.id });
        await this.ghl.syncLead(lead.id).catch(() => undefined);
        if (dto.email) {
            await this.email.sendConfirmation(lead.id, source, dto.email, dto.firstName).catch(() => undefined);
        }
        return { ok: true, leadId: lead.id, blockedFields, message: "Lead received." };
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        compliance_service_1.ComplianceService,
        ghl_service_1.GhlService,
        email_service_1.EmailService,
        audit_service_1.AuditService])
], FormsService);
//# sourceMappingURL=forms.service.js.map