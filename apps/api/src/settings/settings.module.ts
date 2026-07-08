import { Body, Controller, Get, Injectable, Module, Patch, UseGuards } from "@nestjs/common";
import { IsArray } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

class UpdateSettingsDto {
  @IsArray() settings!: { key: string; value: string }[];
}

@Injectable()
class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly config: AppConfigService) {}

  // Non-secret settings from the DB + a masked "configured?" view of secret env.
  async all() {
    const settings = await this.prisma.setting.findMany({ where: { isSecret: false }, orderBy: { category: "asc" } });
    return {
      settings,
      integrations: {
        ghl: { enabled: this.config.ghl.enabled, mockMode: this.config.ghl.mockMode, live: this.config.ghlLive(), tokenConfigured: !!this.config.ghl.token, locationConfigured: !!this.config.ghl.locationId, pipelineConfigured: !!this.config.ghl.pipelineId },
        social: { enabled: this.config.social.enabled, mockMode: this.config.social.mockMode, live: this.config.socialLive() },
        email: { provider: this.config.email.provider, sharedMailbox: this.config.email.sharedMailbox },
        compliance: this.config.compliance,
      },
    };
  }

  async update(dto: UpdateSettingsDto) {
    for (const s of dto.settings) {
      await this.prisma.setting.updateMany({ where: { key: s.key, isSecret: false }, data: { value: s.value } });
    }
    return this.all();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settings")
class SettingsController {
  constructor(private readonly svc: SettingsService) {}
  @RequirePermissions("settings.manage") @Get()
  get() {
    return this.svc.all();
  }
  @RequirePermissions("settings.manage") @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.svc.update(dto);
  }
}

@Module({ providers: [SettingsService], controllers: [SettingsController] })
export class SettingsModule {}
