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
            try {
                const res = await this.ghlSocialPost(platform, caption, scheduledAt);
                externalId = res.externalId;
                status = scheduledAt ? "SCHEDULED" : "PUBLISHED";
            }
            catch (err) {
                status = "FAILED";
                error = err instanceof Error ? err.message : String(err);
            }
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
    status() {
        const a = this.config.social.accountIds;
        return {
            enabled: this.config.social.enabled,
            mockMode: this.config.social.mockMode,
            live: this.config.socialLive(),
            ghlPlanner: this.config.social.ghlPlanner,
            accountsConfigured: { FACEBOOK: !!a.FACEBOOK, INSTAGRAM: !!a.INSTAGRAM, LINKEDIN: !!a.LINKEDIN },
            googleBusinessProfileConfigured: !!this.config.social.googleBusinessProfileId,
        };
    }
    async testConnection() {
        const live = this.config.socialLive();
        const started = Date.now();
        if (!live) {
            await this.logs.record({ provider: "social", operation: "testConnection", status: "mock", durationMs: Date.now() - started });
            return { ok: true, live: false, detail: "Social publishing running in mock mode — no live request made." };
        }
        const configured = Object.values(this.config.social.accountIds).some(Boolean);
        const detail = configured
            ? "GHL token + location present and at least one social account id configured."
            : "Live enabled but no social account ids configured — connect accounts in GHL and set their ids.";
        await this.logs.record({ provider: "social", operation: "testConnection", status: configured ? "success" : "failed", response: { detail }, durationMs: Date.now() - started });
        return { ok: configured, live: true, detail };
    }
    async ghlSocialPost(platform, caption, scheduledAt) {
        const accountId = this.config.social.accountIds[platform];
        if (!accountId)
            throw new Error(`No connected ${platform} account id configured.`);
        const { baseUrl, token, locationId } = this.config.ghl;
        const res = await fetch(`${baseUrl}/social-media-posting/${locationId}/posts`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Version: "2021-07-28", Accept: "application/json" },
            body: JSON.stringify({
                accountIds: [accountId],
                summary: caption,
                type: scheduledAt ? "post" : "post",
                ...(scheduledAt ? { scheduleDate: scheduledAt } : {}),
            }),
        });
        if (!res.ok)
            throw new Error(`GHL social post ${platform} → ${res.status} ${(await res.text()).slice(0, 300)}`);
        const data = (await res.json().catch(() => ({})));
        return { externalId: data.post?.id ?? data.id ?? `ghl_${platform.toLowerCase()}` };
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