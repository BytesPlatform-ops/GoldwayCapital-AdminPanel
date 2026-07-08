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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const integration_logs_service_1 = require("../integration-logs/integration-logs.service");
let SocialService = class SocialService {
    constructor(prisma, config, logs) {
        this.prisma = prisma;
        this.config = config;
        this.logs = logs;
    }
    async publish(contentPostId, platforms, caption, scheduledAt) {
        const results = {};
        for (const platform of platforms) {
            results[platform] = await this.publishOne(contentPostId, platform, caption, scheduledAt);
        }
        return results;
    }
    async publishOne(contentPostId, platform, caption, scheduledAt) {
        const started = Date.now();
        const live = this.config.socialLive();
        let status;
        let externalId = null;
        let error = null;
        if (!live) {
            status = scheduledAt ? "SCHEDULED" : "PUBLISHED";
            externalId = `mock_${platform.toLowerCase()}_${Date.now().toString(36)}`;
        }
        else {
            status = "FAILED";
            error = "Live social publishing not yet configured for this account.";
        }
        await this.upsert(contentPostId, platform, caption, status, externalId, error, scheduledAt);
        await this.logs.record({
            provider: "social",
            operation: `publish:${platform}`,
            status: live ? (status === "FAILED" ? "failed" : "success") : "mock",
            relatedType: "contentPost",
            relatedId: contentPostId,
            request: { platform, scheduled: !!scheduledAt },
            response: { status, error },
            durationMs: Date.now() - started,
        });
        return status;
    }
    async retry(socialPostId) {
        const sp = await this.prisma.socialPost.findUnique({ where: { id: socialPostId } });
        if (!sp)
            return { ok: false };
        const [status] = Object.values(await this.publish(sp.contentPostId, [sp.platform], sp.caption ?? "", sp.scheduledAt?.toISOString()));
        return { ok: status !== "FAILED", status };
    }
    async upsert(contentPostId, platform, caption, status, externalId, error, scheduledAt) {
        const existing = await this.prisma.socialPost.findFirst({ where: { contentPostId, platform } });
        const data = {
            caption,
            status,
            externalId,
            error,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            publishedAt: status === "PUBLISHED" ? new Date() : null,
        };
        if (existing)
            await this.prisma.socialPost.update({ where: { id: existing.id }, data });
        else
            await this.prisma.socialPost.create({ data: { contentPostId, platform, ...data } });
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        integration_logs_service_1.IntegrationLogsService])
], SocialService);
//# sourceMappingURL=social.service.js.map