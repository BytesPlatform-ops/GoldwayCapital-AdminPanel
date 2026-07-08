import { Body, Controller, Get, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ContentService } from "./content.service";
import { SocialModule } from "../social/social.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { CreateContentDto, PublishContentDto, UpdateContentDto } from "./content.dto";

// PUBLIC Resource Center endpoints (consumed by the Next.js public site).
@Controller("public/resource-center")
class PublicContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list() {
    return this.content.publishedList();
  }
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.content.publishedBySlug(slug);
  }
}

// ADMIN content management.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("content")
class ContentController {
  constructor(private readonly content: ContentService) {}

  @RequirePermissions("content.create") @Get()
  list() {
    return this.content.list();
  }
  @RequirePermissions("content.create") @Get(":id")
  get(@Param("id") id: string) {
    return this.content.get(id);
  }
  @RequirePermissions("content.create") @Post()
  create(@Body() dto: CreateContentDto, @CurrentUser() user: AuthUser) {
    return this.content.create(dto, user);
  }
  @RequirePermissions("content.create") @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateContentDto, @CurrentUser() user: AuthUser) {
    return this.content.update(id, dto, user);
  }
  @RequirePermissions("content.create") @Post(":id/submit-review")
  submit(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.content.submitForReview(id, user);
  }
  @RequirePermissions("content.review") @Post(":id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.content.approve(id, user);
  }
  @RequirePermissions("content.publish") @Post(":id/publish")
  publish(@Param("id") id: string, @Body() dto: PublishContentDto, @CurrentUser() user: AuthUser) {
    return this.content.publish(id, dto.platforms ?? [], user);
  }
}

@Module({ imports: [SocialModule], providers: [ContentService], controllers: [ContentController, PublicContentController] })
export class ContentModule {}
