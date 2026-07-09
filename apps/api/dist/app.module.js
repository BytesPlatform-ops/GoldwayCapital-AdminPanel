"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const app_config_module_1 = require("./config/app-config.module");
const auth_module_1 = require("./auth/auth.module");
const compliance_module_1 = require("./compliance/compliance.module");
const ghl_module_1 = require("./ghl/ghl.module");
const wordpress_module_1 = require("./wordpress/wordpress.module");
const email_module_1 = require("./email/email.module");
const integrations_module_1 = require("./integrations/integrations.module");
const audit_module_1 = require("./audit/audit.module");
const integration_logs_module_1 = require("./integration-logs/integration-logs.module");
const forms_module_1 = require("./forms/forms.module");
const leads_module_1 = require("./leads/leads.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const pipeline_module_1 = require("./pipeline/pipeline.module");
const content_module_1 = require("./content/content.module");
const social_module_1 = require("./social/social.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const settings_module_1 = require("./settings/settings.module");
const logs_module_1 = require("./logs/logs.module");
const misc_module_1 = require("./misc/misc.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
            app_config_module_1.AppConfigModule,
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            integration_logs_module_1.IntegrationLogsModule,
            auth_module_1.AuthModule,
            compliance_module_1.ComplianceModule,
            ghl_module_1.GhlModule,
            wordpress_module_1.WordpressModule,
            email_module_1.EmailModule,
            forms_module_1.FormsModule,
            leads_module_1.LeadsModule,
            dashboard_module_1.DashboardModule,
            pipeline_module_1.PipelineModule,
            content_module_1.ContentModule,
            social_module_1.SocialModule,
            integrations_module_1.IntegrationsModule,
            webhooks_module_1.WebhooksModule,
            settings_module_1.SettingsModule,
            logs_module_1.LogsModule,
            misc_module_1.MiscModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map