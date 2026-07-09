import type { AppConfigService } from "../config/app-config.service";
import type {
  WordpressAdapter,
  WpCategory,
  WpConnectionResult,
  WpMediaResult,
  WpPostInput,
  WpPostResult,
} from "./wordpress.types";

/**
 * Live WordPress adapter — WordPress REST API (wp-json/wp/v2) authenticated with
 * an Application Password over HTTPS Basic auth. Exercised only when
 * config.wordpressLive() is true. Throws on HTTP failure; the service wraps calls
 * in retry + logging. All request shapes live here — the single place to adjust
 * once the client's WordPress site is connected.
 */
export class WordpressLiveAdapter implements WordpressAdapter {
  readonly isLive = true;
  constructor(private readonly config: AppConfigService) {}

  private base(): string {
    return `${this.config.wordpress.baseUrl}/wp-json/wp/v2`;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const token = Buffer.from(`${this.config.wordpress.username}:${this.config.wordpress.appPassword}`).toString("base64");
    return { Authorization: `Basic ${token}`, Accept: "application/json", ...extra };
  }

  private async req<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base()}${path}`, {
      method,
      headers: this.headers(body ? { "Content-Type": "application/json" } : undefined),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`WordPress ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 400)}`);
    return (await res.json().catch(() => ({}))) as T;
  }

  private mapPost(data: { id: number; link?: string; status?: string }): WpPostResult {
    return { postId: String(data.id), url: data.link ?? "", status: data.status ?? "draft", mock: false };
  }

  private buildBody(input: Partial<WpPostInput>) {
    const categoryId = input.categoryId ?? this.config.wordpress.categoryId;
    const authorId = input.authorId ?? this.config.wordpress.authorId;
    return {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(categoryId ? { categories: [Number(categoryId)] } : {}),
      ...(authorId ? { author: Number(authorId) } : {}),
      ...(input.featuredMediaId ? { featured_media: Number(input.featuredMediaId) } : {}),
    };
  }

  async testConnection(): Promise<WpConnectionResult> {
    // /users/me is the cheapest authenticated call — validates creds without writing.
    const data = await this.req<{ name?: string; slug?: string }>("/users/me?context=edit", "GET");
    return { ok: true, mock: false, detail: `Authenticated as ${data.name ?? data.slug ?? "user"}.`, siteName: data.name };
  }

  async createPost(input: WpPostInput): Promise<WpPostResult> {
    const data = await this.req<{ id: number; link?: string; status?: string }>("/posts", "POST", this.buildBody(input));
    return this.mapPost(data);
  }

  async updatePost(postId: string, input: Partial<WpPostInput>): Promise<WpPostResult> {
    const data = await this.req<{ id: number; link?: string; status?: string }>(`/posts/${postId}`, "POST", this.buildBody(input));
    return this.mapPost(data);
  }

  async uploadMedia(input: { url: string; filename?: string }): Promise<WpMediaResult> {
    const src = await fetch(input.url);
    if (!src.ok) throw new Error(`WordPress media fetch failed: ${input.url} → ${src.status}`);
    const buf = Buffer.from(await src.arrayBuffer());
    const filename = input.filename ?? input.url.split("/").pop() ?? "upload";
    const res = await fetch(`${this.base()}/media`, {
      method: "POST",
      headers: this.headers({
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": src.headers.get("content-type") ?? "application/octet-stream",
      }),
      body: buf,
    });
    if (!res.ok) throw new Error(`WordPress media upload → ${res.status} ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { id: number; source_url?: string };
    return { mediaId: String(data.id), url: data.source_url ?? "", mock: false };
  }

  async getCategories(): Promise<WpCategory[]> {
    const data = await this.req<{ id: number; name: string; slug: string }[]>("/categories?per_page=100", "GET");
    return data.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
  }
}
