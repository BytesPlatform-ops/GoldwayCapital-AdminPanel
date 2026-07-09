import { Injectable, Logger } from "@/lib/nest";
import type { ContentPost } from "@prisma/client";
import { PrismaService } from "@/db/prisma";
import { AppConfigService } from "@/lib/config";
import { IntegrationLogsService } from "@/server/integration-logs";
import { WordpressMockAdapter } from "./wordpress-mock.adapter";
import { WordpressLiveAdapter } from "./wordpress-live.adapter";
import type { WordpressAdapter, WpConnectionResult, WpStatus } from "./wordpress.types";

export class WordpressService {
  private readonly logger = new Logger("WordPress");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly logs: IntegrationLogsService
  ) {}

  /** Picks live vs mock. Missing creds never throw — mock is always available. */
  adapter(): WordpressAdapter {
    return this.config.wordpressLive() ? new WordpressLiveAdapter(this.config) : new WordpressMockAdapter(this.config.wordpress.baseUrl);
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

  async testConnection(): Promise<WpConnectionResult & { live: boolean }> {
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
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await this.logs.record({ provider: "wordpress", operation: "testConnection", status: "failed", response: { detail }, durationMs: Date.now() - started });
      return { ok: false, mock: false, detail, live: adapter.isLive };
    }
  }

  /** Publish (or re-publish) a ContentPost to WordPress and mirror the ids back. */
  async publishResourceArticle(postId: string, status?: WpStatus): Promise<{ ok: boolean; postId?: string; url?: string; status?: string; error?: string; mock: boolean }> {
    const post = await this.prisma.contentPost.findUnique({ where: { id: postId } });
    if (!post) return { ok: false, error: "Content not found", mock: false };
    const adapter = this.adapter();
    const started = Date.now();
    const wpStatus = (status ?? (this.config.wordpress.statusDefault as WpStatus)) || "draft";

    try {
      const input = {
        title: post.title,
        content: post.body,
        excerpt: post.excerpt,
        slug: post.slug,
        status: wpStatus,
      };
      const result = await this.logs.withRetry(() =>
        post.wordpressPostId ? adapter.updatePost(post.wordpressPostId!, input) : adapter.createPost(input)
      );

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
    } catch (err) {
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

  /** Test draft used by the Integrations page — proves the write path without touching real content. */
  async publishTestDraft(): Promise<{ ok: boolean; url?: string; postId?: string; detail: string; mock: boolean }> {
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
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await this.logs.record({ provider: "wordpress", operation: "publishTestDraft", status: "failed", response: { detail }, durationMs: Date.now() - started });
      return { ok: false, detail, mock: adapter.isLive ? false : true };
    }
  }

  getCategories() {
    return this.adapter().getCategories();
  }

  /** Re-run a previously failed WordPress publish for a content post. */
  async retry(post: ContentPost) {
    return this.publishResourceArticle(post.id);
  }
}
