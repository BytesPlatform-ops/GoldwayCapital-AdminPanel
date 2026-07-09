import type {
  WordpressAdapter,
  WpCategory,
  WpConnectionResult,
  WpMediaResult,
  WpPostInput,
  WpPostResult,
} from "./wordpress.types";

/** Mock WordPress — deterministic fake ids/urls, no network. Used when WP is off/mock. */
export class WordpressMockAdapter implements WordpressAdapter {
  readonly isLive = false;

  constructor(private readonly baseUrl = "https://example.wordpress.test") {}

  private id(prefix: string, seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
    return `mock_${prefix}_${Math.abs(h).toString(36)}`;
  }

  private url(slug: string): string {
    const base = this.baseUrl || "https://example.wordpress.test";
    return `${base}/${slug || "resource"}`;
  }

  async testConnection(): Promise<WpConnectionResult> {
    return { ok: true, mock: true, detail: "WordPress running in mock mode — no live request made.", siteName: "Mock Site" };
  }

  async createPost(input: WpPostInput): Promise<WpPostResult> {
    const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return { postId: this.id("post", input.title), url: this.url(slug), status: input.status, mock: true };
  }

  async updatePost(postId: string, input: Partial<WpPostInput>): Promise<WpPostResult> {
    const slug = input.slug || postId;
    return { postId, url: this.url(slug), status: input.status ?? "draft", mock: true };
  }

  async uploadMedia(input: { url: string; filename?: string }): Promise<WpMediaResult> {
    return { mediaId: this.id("media", input.url), url: input.url, mock: true };
  }

  async getCategories(): Promise<WpCategory[]> {
    return [
      { id: "mock_cat_resource", name: "Resource Center", slug: "resource-center" },
      { id: "mock_cat_medicare", name: "Medicare", slug: "medicare" },
      { id: "mock_cat_probate", name: "Probate", slug: "probate" },
    ];
  }
}
