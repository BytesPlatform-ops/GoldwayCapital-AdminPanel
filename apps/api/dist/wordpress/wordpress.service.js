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
exports.WordpressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const integration_logs_service_1 = require("../integration-logs/integration-logs.service");
const wordpress_mock_adapter_1 = require("./wordpress-mock.adapter");
const wordpress_live_adapter_1 = require("./wordpress-live.adapter");
let WordpressService = class WordpressService {
    constructor(prisma, config, logs) {
        this.prisma = prisma;
        this.config = config;
        this.logs = logs;
        this.logger = new common_1.Logger("WordPress");
    }
    adapter() {
        return this.config.wordpressLive() ? new wordpress_live_adapter_1.WordpressLiveAdapter(this.config) : new wordpress_mock_adapter_1.WordpressMockAdapter(this.config.wordpress.baseUrl);
    }
    status() {
        return {
            enabled: this.config.wordpress.enabled,
            mockMode: this.config.wordpress.mockMode,
            live: this.config.wordpressLive(),
            baseUrl: this.config.wordpress.baseUrl || null,
            usernameConfigured: !!this.config.wordpress.username,
            appPasswordConfigured: !!this.config.wordpress.appPassword,
            authorId: this.config.wordpress.authorId || null,
            categoryId: this.config.wordpress.categoryId || null,
            statusDefault: this.config.wordpress.statusDefault,
        };
    }
    async testConnection() {
        const adapter = this.adapter();
        const started = Date.now();
        try {
            const result = await adapter.testConnection();
            await this.logs.record({
                provider: "wordpress",
                operation: "testConnection",
                status: adapter.isLive ? "success" : "mock",
                response: { ...result },
                durationMs: Date.now() - started,
            });
            return { ...result, live: adapter.isLive };
        }
        catch (err) {
            const detail = err instanceof Error ? err.message : String(err);
            await this.logs.record({ provider: "wordpress", operation: "testConnection", status: "failed", response: { detail }, durationMs: Date.now() - started });
            return { ok: false, mock: false, detail, live: adapter.isLive };
        }
    }
    async publishResourceArticle(postId, status) {
        const post = await this.prisma.contentPost.findUnique({ where: { id: postId } });
        if (!post)
            return { ok: false, error: "Content not found", mock: false };
        const adapter = this.adapter();
        const started = Date.now();
        const wpStatus = (status ?? this.config.wordpress.statusDefault) || "draft";
        try {
            const input = {
                title: post.title,
                content: post.body,
                excerpt: post.excerpt,
                slug: post.slug,
                status: wpStatus,
            };
            const result = await this.logs.withRetry(() => post.wordpressPostId ? adapter.updatePost(post.wordpressPostId, input) : adapter.createPost(input));
            await this.prisma.contentPost.update({
                where: { id: post.id },
                data: { wordpressPostId: result.postId, wordpressUrl: result.url, wordpressStatus: result.status },
            });
            await this.logs.record({
                provider: "wordpress",
                operation: post.wordpressPostId ? "updatePost" : "createPost",
                status: result.mock ? "mock" : "success",
                relatedType: "contentPost",
                relatedId: post.id,
                response: { postId: result.postId, url: result.url, status: result.status },
                durationMs: Date.now() - started,
            });
            return { ok: true, postId: result.postId, url: result.url, status: result.status, mock: result.mock };
        }
        catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            await this.logs.record({
                provider: "wordpress",
                operation: "publishResourceArticle",
                status: "failed",
                relatedType: "contentPost",
                relatedId: post.id,
                response: { error },
                durationMs: Date.now() - started,
            });
            this.logger.warn(`WordPress publish failed for ${post.id}: ${error}`);
            return { ok: false, error, mock: adapter.isLive ? false : true };
        }
    }
    async publishTestDraft() {
        const adapter = this.adapter();
        const started = Date.now();
        try {
            const result = await adapter.createPost({
                title: "Goldway integration test draft",
                content: "<p>This is an automated connection test from the Goldway admin panel. Safe to delete.</p>",
                status: "draft",
            });
            await this.logs.record({
                provider: "wordpress",
                operation: "publishTestDraft",
                status: result.mock ? "mock" : "success",
                response: { postId: result.postId, url: result.url },
                durationMs: Date.now() - started,
            });
            return { ok: true, postId: result.postId, url: result.url, detail: result.mock ? "Mock draft created (no live request)." : "Draft created on WordPress.", mock: result.mock };
        }
        catch (err) {
            const detail = err instanceof Error ? err.message : String(err);
            await this.logs.record({ provider: "wordpress", operation: "publishTestDraft", status: "failed", response: { detail }, durationMs: Date.now() - started });
            return { ok: false, detail, mock: adapter.isLive ? false : true };
        }
    }
    getCategories() {
        return this.adapter().getCategories();
    }
    async retry(post) {
        return this.publishResourceArticle(post.id);
    }
};
exports.WordpressService = WordpressService;
exports.WordpressService = WordpressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService,
        integration_logs_service_1.IntegrationLogsService])
], WordpressService);
//# sourceMappingURL=wordpress.service.js.map