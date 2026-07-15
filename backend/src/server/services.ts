/**
 * Composition root. Instantiates every service once (manual DI, replacing the old
 * NestJS container) and shares them across route handlers. Cached on globalThis so
 * dev HMR reloads reuse the same instances (and the single PrismaClient).
 */
import { prisma } from "@/db/prisma";
import { config } from "@/lib/config";
import { AuditService } from "./audit";
import { IntegrationLogsService } from "./integration-logs";
import { ComplianceService } from "./compliance";
import { EmailService } from "@/integrations/email/email.service";
import { GhlService } from "@/integrations/ghl/ghl.service";
import { WordpressService } from "@/integrations/wordpress/wordpress.service";
import { SocialService } from "@/integrations/social/social.service";
import { FormsService } from "./forms";
import { LeadsService } from "./leads";
import { ContentService } from "./content";
import { DashboardService } from "./dashboard";
import { PipelineService } from "./pipeline";
import { SettingsService } from "./settings";
import { MiscService } from "./misc";
import { IntegrationsService } from "./integrations";
import { WebhooksService } from "./webhooks";

function build() {
  // Fail fast when GHL is flipped live without its required env (skips in test/mock).
  config.assertGhlConfigured();
  // Presence-only startup log — never prints secret values.
  console.info("[config] GHL", JSON.stringify(config.ghlConfigReport()));
  const audit = new AuditService(prisma);
  const integrationLogs = new IntegrationLogsService(prisma);
  const compliance = new ComplianceService(prisma);
  const email = new EmailService(prisma, config, integrationLogs);
  const ghl = new GhlService(prisma, config, integrationLogs);
  const wordpress = new WordpressService(prisma, config, integrationLogs);
  const social = new SocialService(prisma, config, integrationLogs);
  const forms = new FormsService(prisma, config, compliance, ghl, email, audit);
  const leads = new LeadsService(prisma, compliance, ghl, audit);
  const content = new ContentService(prisma, config, compliance, social, wordpress, audit);
  const dashboard = new DashboardService(prisma);
  const pipeline = new PipelineService(prisma);
  const settings = new SettingsService(prisma, config);
  const misc = new MiscService(prisma, audit);
  const integrations = new IntegrationsService(prisma, config, ghl, wordpress, social);
  const webhooks = new WebhooksService(prisma, config, audit);
  return { audit, integrationLogs, compliance, email, ghl, wordpress, social, forms, leads, content, dashboard, pipeline, settings, misc, integrations, webhooks };
}

const g = globalThis as unknown as { __goldwayServices?: ReturnType<typeof build> };
export const services = g.__goldwayServices ?? build();
if (process.env.NODE_ENV !== "production") g.__goldwayServices = services;
