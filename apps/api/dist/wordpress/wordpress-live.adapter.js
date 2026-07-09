"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordpressLiveAdapter = void 0;
class WordpressLiveAdapter {
    constructor(config) {
        this.config = config;
        this.isLive = true;
    }
    base() {
        return `${this.config.wordpress.baseUrl}/wp-json/wp/v2`;
    }
    headers(extra) {
        const token = Buffer.from(`${this.config.wordpress.username}:${this.config.wordpress.appPassword}`).toString("base64");
        return { Authorization: `Basic ${token}`, Accept: "application/json", ...extra };
    }
    async req(path, method, body) {
        const res = await fetch(`${this.base()}${path}`, {
            method,
            headers: this.headers(body ? { "Content-Type": "application/json" } : undefined),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok)
            throw new Error(`WordPress ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 400)}`);
        return (await res.json().catch(() => ({})));
    }
    mapPost(data) {
        return { postId: String(data.id), url: data.link ?? "", status: data.status ?? "draft", mock: false };
    }
    buildBody(input) {
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
    async testConnection() {
        const data = await this.req("/users/me?context=edit", "GET");
        return { ok: true, mock: false, detail: `Authenticated as ${data.name ?? data.slug ?? "user"}.`, siteName: data.name };
    }
    async createPost(input) {
        const data = await this.req("/posts", "POST", this.buildBody(input));
        return this.mapPost(data);
    }
    async updatePost(postId, input) {
        const data = await this.req(`/posts/${postId}`, "POST", this.buildBody(input));
        return this.mapPost(data);
    }
    async uploadMedia(input) {
        const src = await fetch(input.url);
        if (!src.ok)
            throw new Error(`WordPress media fetch failed: ${input.url} → ${src.status}`);
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
        if (!res.ok)
            throw new Error(`WordPress media upload → ${res.status} ${(await res.text()).slice(0, 300)}`);
        const data = (await res.json());
        return { mediaId: String(data.id), url: data.source_url ?? "", mock: false };
    }
    async getCategories() {
        const data = await this.req("/categories?per_page=100", "GET");
        return data.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug }));
    }
}
exports.WordpressLiveAdapter = WordpressLiveAdapter;
//# sourceMappingURL=wordpress-live.adapter.js.map