import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { SocialPlatform } from "@prisma/client";

export class CreateContentDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @IsString() body!: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsString() @MaxLength(500) featuredImage?: string;
  @IsOptional() @IsString() @MaxLength(200) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(300) seoDescription?: string;
  @IsOptional() @IsString() @MaxLength(600) socialCaption?: string;
}

export class UpdateContentDto extends CreateContentDto {
  @IsOptional() @IsString() @MaxLength(200) declare title: string;
  @IsOptional() @IsString() declare body: string;
}

export class PublishContentDto {
  @IsOptional() @IsArray() platforms?: SocialPlatform[];
  @IsOptional() @IsBoolean() publishToWordpress?: boolean;
  @IsOptional() @IsString() @IsIn(["draft", "publish"]) wordpressStatus?: "draft" | "publish";
}
