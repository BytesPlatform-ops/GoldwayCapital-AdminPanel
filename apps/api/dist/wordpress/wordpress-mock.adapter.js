"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordpressMockAdapter = void 0;
class WordpressMockAdapter {
    constructor(baseUrl = "https://example.wordpress.test") {
        this.baseUrl = baseUrl;
        this.isLive = false;
    }
    id(prefix, seed) {
        let h = 0;
        for (let i = 0; i < seed.length; i++)
            h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
        return `mock_${prefix}_${Math.abs(h).toString(36)}`;
    }
    url(slug) {
        const base = this.baseUrl || "https://example.wordpress.test";
        return `${base}/${slug || "resource"}`;
    }
    async testConnection() {
        return { ok: true, mock: true, detail: "WordPress running in mock mode — no live request made.", siteName: "Mock Site" };
    }
    async createPost(input) {
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return { postId: this.id("post", input.title), url: this.url(slug), status: input.status, mock: true };
    }
    async updatePost(postId, input) {
        const slug = input.slug || postId;
        return { postId, url: this.url(slug), status: input.status ?? "draft", mock: true };
    }
    async uploadMedia(input) {
        return { mediaId: this.id("media", input.url), url: input.url, mock: true };
    }
    async getCategories() {
        return [
            { id: "mock_cat_resource", name: "Resource Center", slug: "resource-center" },
            { id: "mock_cat_medicare", name: "Medicare", slug: "medicare" },
            { id: "mock_cat_probate", name: "Probate", slug: "probate" },
        ];
    }
}
exports.WordpressMockAdapter = WordpressMockAdapter;
//# sourceMappingURL=wordpress-mock.adapter.js.map