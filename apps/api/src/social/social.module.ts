import { Body, Controller, Module, Param, Post, UseGuards } from "@nestjs/common";
import { IsArray, IsOptional, IsString } from "class-validator";
import { SocialPlatform } from "@prisma/client";
import { SocialService } from "./social.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

class PublishDto {
  @IsString() contentPostId!: string;
  @IsArray() platforms!: SocialPlatform[];
  @IsString() caption!: string;
  @IsOptional() @IsString() scheduledAt?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("social")
class SocialController {
  constructor(private readonly social: SocialService) {}

  @RequirePermissions("content.publish") @Post("publish")
  publish(@Body() dto: PublishDto) {
    return this.social.publish(dto.contentPostId, dto.platforms, dto.caption);
  }

  @RequirePermissions("content.publish") @Post("schedule")
  schedule(@Body() dto: PublishDto) {
    return this.social.publish(dto.contentPostId, dto.platforms, dto.caption, dto.scheduledAt);
  }

  @RequirePermissions("content.publish") @Post("retry/:id")
  retry(@Param("id") id: string) {
    return this.social.retry(id);
  }
}

@Module({ providers: [SocialService], controllers: [SocialController], exports: [SocialService] })
export class SocialModule {}
