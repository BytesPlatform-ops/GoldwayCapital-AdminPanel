import { Controller, Get, Module, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { IntegrationLogsService } from "../integration-logs/integration-logs.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("audit-logs")
class AuditLogsController {
  constructor(private readonly audit: AuditService) {}
  @RequirePermissions("audit.view") @Get()
  list() {
    return this.audit.list(150);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("integration-logs")
class IntegrationLogsController {
  constructor(private readonly logs: IntegrationLogsService, private readonly prisma: PrismaService) {}
  @RequirePermissions("integrations.manage") @Get()
  async list() {
    const [calls, webhooks] = await Promise.all([
      this.logs.list(80),
      this.prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return { calls, webhooks };
  }
}

// AuditService + IntegrationLogsService come from their global modules.
@Module({ controllers: [AuditLogsController, IntegrationLogsController] })
export class LogsModule {}
