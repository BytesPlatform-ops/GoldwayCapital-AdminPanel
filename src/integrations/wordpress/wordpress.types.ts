export type WpStatus = "draft" | "publish" | "pending" | "private";

export interface WpPostInput {
  title: string;
  content: string;
  excerpt?: string | null;
  slug?: string | null;
  status: WpStatus;
  categoryId?: string | null;
  authorId?: string | null;
  featuredMediaId?: string | null;
}

export interface WpPostResult {
  postId: string;
  url: string;
  status: string;
  mock: boolean;
}

export interface WpMediaResult {
  mediaId: string;
  url: string;
  mock: boolean;
}

export interface WpCategory {
  id: string;
  name: string;
  slug: string;
}

export interface WpConnectionResult {
  ok: boolean;
  mock: boolean;
  detail: string;
  siteName?: string;
}

/** The port every WordPress implementation (mock or live) satisfies. */
export interface WordpressAdapter {
  readonly isLive: boolean;
  testConnection(): Promise<WpConnectionResult>;
  createPost(input: WpPostInput): Promise<WpPostResult>;
  updatePost(postId: string, input: Partial<WpPostInput>): Promise<WpPostResult>;
  uploadMedia(input: { url: string; filename?: string }): Promise<WpMediaResult>;
  getCategories(): Promise<WpCategory[]>;
}
