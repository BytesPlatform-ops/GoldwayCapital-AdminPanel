import type { PrismaService } from "@/db/prisma";
import type { AppConfigService } from "@/lib/config";

export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly config: AppConfigService) {}

  // Non-secret settings from the DB + a masked "configured?" view of secret env.
  async all() {
    const settings = await this.prisma.setting.findMany({ where: { isSecret: false }, orderBy: { category: "asc" } });
    return {
      settings,
      integrations: {
        ghl: { enabled: this.config.ghl.enabled, mockMode: this.config.ghl.mockMode, live: this.config.ghlLive(), tokenConfigured: !!this.config.ghl.token, locationConfigured: !!this.config.ghl.locationId, pipelineConfigured: !!this.config.ghl.pipelineId },
        social: { enabled: this.config.social.enabled, mockMode: this.config.social.mockMode, live: this.config.socialLive() },
        wordpress: { enabled: this.config.wordpress.enabled, mockMode: this.config.wordpress.mockMode, live: this.config.wordpressLive() },
        email: { provider: this.config.email.provider, sharedMailbox: this.config.email.sharedMailbox },
        compliance: this.config.compliance,
      },
    };
  }

  async update(dto: { settings: { key: string; value: string }[] }) {
    for (const s of dto.settings) {
      await this.prisma.setting.updateMany({ where: { key: s.key, isSecret: false }, data: { value: s.value } });
    }
    return this.all();
  }
}
