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
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const ghl_service_1 = require("../ghl/ghl.service");
const wordpress_service_1 = require("../wordpress/wordpress.service");
const social_service_1 = require("../social/social.service");
const social_module_1 = require("../social/social.module");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let IntegrationsService = class IntegrationsService {
    constructor(prisma, config, ghl, wordpress, social) {
        this.prisma = prisma;
        this.config = config;
        this.ghl = ghl;
        this.wordpress = wordpress;
        this.social = social;
    }
    lastLog(provider) {
        return this.prisma.integrationLog.findFirst({ where: { provider }, orderBy: { createdAt: "desc" }, select: { status: true, operation: true, createdAt: true } });
    }
    async status() {
        const [wpLog, ghlLog, socialLog, emailLog, lastWebhook, failedCount] = await Promise.all([
            this.lastLog("wordpress"),
            this.lastLog("ghl"),
            this.lastLog("social"),
            this.lastLog("email"),
            this.prisma.webhookEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { eventType: true, processed: true, createdAt: true } }),
            this.prisma.integrationLog.count({ where: { status: "failed" } }),
        ]);
        return {
            wordpress: { ...this.wordpress.status(), lastLog: wpLog },
            ghl: { ...this.ghl.status(), lastLog: ghlLog },
            social: { ...this.social.status(), lastLog: socialLog },
            email: { provider: this.config.email.provider, sharedMailbox: this.config.email.sharedMailbox, lastLog: emailLog },
            webhooks: {
                url: `${this.config.wordpress.baseUrl ? "" : ""}${process.env.API_URL ?? "http://localhost:4000"}/webhooks/ghl`,
                secretConfigured: !!this.config.ghl.webhookSecret,
                last: lastWebhook,
            },
            failedCount,
        };
    }
    async retry(logId) {
        const log = await this.prisma.integrationLog.findUnique({ where: { id: logId } });
        if (!log)
            throw new common_1.NotFoundException("Integration log not found");
        if (log.provider === "ghl" && log.relatedType === "lead" && log.relatedId) {
            const lead = await this.ghl.syncLead(log.relatedId);
            return { ok: !!lead && lead.ghlSyncStatus !== "FAILED", provider: "ghl" };
        }
        if (log.provider === "wordpress" && log.relatedType === "contentPost" && log.relatedId) {
            const r = await this.wordpress.publishResourceArticle(log.relatedId);
            return { ok: r.ok, provider: "wordpress" };
        }
        if (log.provider === "social" && log.relatedType === "contentPost" && log.relatedId) {
            const failed = await this.prisma.socialPost.findMany({ where: { contentPostId: log.relatedId, status: "FAILED" } });
            const results = await Promise.all(failed.map((sp) => this.social.retry(sp.id)));
            return { ok: results.every((r) => r.ok), provider: "social", retried: results.length };
        }
        return { ok: false, provider: log.provider, detail: "This log type cannot be retried automatically." };
    }
};
IntegrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        ghl_service_1.GhlService,
        wordpress_service_1.WordpressService,
        social_service_1.SocialService])
], IntegrationsService);
let IntegrationsController = class IntegrationsController {
    constructor(svc, ghl, wordpress, social) {
        this.svc = svc;
        this.ghl = ghl;
        this.wordpress = wordpress;
        this.social = social;
    }
    status() {
        return this.svc.status();
    }
    wpTest() {
        return this.wordpress.testConnection();
    }
    wpDraft() {
        return this.wordpress.publishTestDraft();
    }
    ghlTest() {
        return this.ghl.testConnection();
    }
    ghlSync() {
        return this.ghl.testSyncLead();
    }
    socialTest() {
        return this.social.testConnection();
    }
    retry(logId) {
        return this.svc.retry(logId);
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Get)("status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "status", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("wordpress/test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "wpTest", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("wordpress/publish-test-draft"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "wpDraft", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("ghl/test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "ghlTest", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("ghl/sync-test-lead"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "ghlSync", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("social/test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "socialTest", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("retry/:logId"),
    __param(0, (0, common_1.Param)("logId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IntegrationsController.prototype, "retry", null);
IntegrationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("integrations"),
    __metadata("design:paramtypes", [IntegrationsService,
        ghl_service_1.GhlService,
        wordpress_service_1.WordpressService,
        social_service_1.SocialService])
], IntegrationsController);
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({ imports: [social_module_1.SocialModule], providers: [IntegrationsService], controllers: [IntegrationsController] })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map