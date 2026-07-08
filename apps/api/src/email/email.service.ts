import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { IntegrationLogsService } from "../integration-logs/integration-logs.service";
import { leadSourceDef } from "../common/constants";
import type { LeadSource } from "@prisma/client";

@Injectable()
export class EmailService {
  private readonly logger = new Logger("Email");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly logs: IntegrationLogsService
  ) {}

  /** Sends an email. Provider "mock" (default) logs only; smtp/m365 are stubs. */
  async send(input: { to: string; subject: string; html: string; templateKey?: string; leadId?: string }) {
    const status: "mock" | "sent" = "mock"; // smtp/m365 fall through to mock until configured
    const providerMessageId = `${this.config.email.provider}_${Date.now().toString(36)}`;

    if (input.leadId) {
      await this.prisma.emailLog
        .create({
          data: {
            leadId: input.leadId,
            templateKey: input.templateKey,
            subject: input.subject,
            body: input.html,
            direction: "outbound",
            status,
            providerMessageId,
          },
        })
        .catch((e) => this.logger.error(`emailLog failed: ${e}`));
    }

    await this.logs.record({
      provider: "email",
      operation: input.templateKey ?? "send",
      status: "mock",
      relatedType: input.leadId ? "lead" : undefined,
      relatedId: input.leadId,
      request: { to: input.to, subject: input.subject },
    });
    return { status, providerMessageId };
  }

  async sendConfirmation(leadId: string, source: LeadSource, to: string, firstName: string) {
    const def = leadSourceDef(source);
    const subject =
      source === "RECRUITING"
        ? "Thanks for your interest in joining Goldway Capital"
        : "We received your request — Goldway Capital";
    const intro =
      source === "RECRUITING"
        ? "Thank you for your interest in Medicare agent opportunities with Goldway Capital."
        : `Thank you for reaching out to Goldway Capital about ${def.serviceInterest}.`;
    const html = `<p>Hi ${escapeHtml(firstName)},</p>
<p>${intro} A member of our team will contact you shortly to schedule your consultation.</p>
<p>Warm regards,<br/>Goldway Capital — A Senior Solutions Company</p>
<hr/><p style="font-size:12px;color:#666">Please do not reply with medical, prescription, health, or coverage details.</p>`;
    return this.send({ to, subject, html, templateKey: `confirmation.${def.key}`, leadId });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
