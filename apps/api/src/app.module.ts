import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AppConfigModule } from "./config/app-config.module";
import { AuthModule } from "./auth/auth.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { GhlModule } from "./ghl/ghl.module";
import { WordpressModule } from "./wordpress/wordpress.module";
import { EmailModule } from "./email/email.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { AuditModule } from "./audit/audit.module";
import { IntegrationLogsModule } from "./integration-logs/integration-logs.module";
import { FormsModule } from "./forms/forms.module";
import { LeadsModule } from "./leads/leads.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { ContentModule } from "./content/content.module";
import { SocialModule } from "./social/social.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { SettingsModule } from "./settings/settings.module";
import { LogsModule } from "./logs/logs.module";
import { MiscModule } from "./misc/misc.module";

@Module({
  imports: [
    // Loads .env from apps/api and the repo root.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    AppConfigModule,
    PrismaModule,
    AuditModule,
    IntegrationLogsModule,
    AuthModule,
    ComplianceModule,
    GhlModule,
    WordpressModule,
    EmailModule,
    FormsModule,
    LeadsModule,
    DashboardModule,
    PipelineModule,
    ContentModule,
    SocialModule,
    IntegrationsModule,
    WebhooksModule,
    SettingsModule,
    LogsModule,
    MiscModule,
  ],
})
export class AppModule {}
