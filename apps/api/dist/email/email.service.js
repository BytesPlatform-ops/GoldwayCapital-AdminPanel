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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const integration_logs_service_1 = require("../integration-logs/integration-logs.service");
const constants_1 = require("../common/constants");
let EmailService = class EmailService {
    constructor(prisma, config, logs) {
        this.prisma = prisma;
        this.config = config;
        this.logs = logs;
        this.logger = new common_1.Logger("Email");
    }
    async send(input) {
        const status = "mock";
        const providerMessageId = `${this.config.email.provider}_${Date.now().toString(36)}`;
        if (input.leadId) {
            await this.prisma.emailLog
                .create({
                data: {
                    leadId: input.leadId,
                    templateKey: input.templateKey,
                    subject: input.subject,
                    body: input.html,
                    direction: "outbound",
                    status,
                    providerMessageId,
                },
            })
                .catch((e) => this.logger.error(`emailLog failed: ${e}`));
        }
        await this.logs.record({
            provider: "email",
            operation: input.templateKey ?? "send",
            status: "mock",
            relatedType: input.leadId ? "lead" : undefined,
            relatedId: input.leadId,
            request: { to: input.to, subject: input.subject },
        });
        return { status, providerMessageId };
    }
    async sendConfirmation(leadId, source, to, firstName) {
        const def = (0, constants_1.leadSourceDef)(source);
        const subject = source === "RECRUITING"
            ? "Thanks for your interest in joining Goldway Capital"
            : "We received your request — Goldway Capital";
        const intro = source === "RECRUITING"
            ? "Thank you for your interest in Medicare agent opportunities with Goldway Capital."
            : `Thank you for reaching out to Goldway Capital about ${def.serviceInterest}.`;
        const html = `<p>Hi ${escapeHtml(firstName)},</p>
<p>${intro} A member of our team will contact you shortly to schedule your consultation.</p>
<p>Warm regards,<br/>Goldway Capital — A Senior Solutions Company</p>
<hr/><p style="font-size:12px;color:#666">Please do not reply with medical, prescription, health, or coverage details.</p>`;
        return this.send({ to, subject, html, templateKey: `confirmation.${def.key}`, leadId });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        integration_logs_service_1.IntegrationLogsService])
], EmailService);
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
//# sourceMappingURL=email.service.js.map