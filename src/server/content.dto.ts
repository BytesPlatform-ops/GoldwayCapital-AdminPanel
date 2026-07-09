import type { SocialPlatform } from "@prisma/client";

export interface CreateContentDto {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  category?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  socialCaption?: string;
}

export interface UpdateContentDto extends Partial<CreateContentDto> {
  title: string;
  body: string;
}

export interface PublishContentDto {
  platforms?: SocialPlatform[];
  publishToWordpress?: boolean;
  wordpressStatus?: "draft" | "publish";
}
