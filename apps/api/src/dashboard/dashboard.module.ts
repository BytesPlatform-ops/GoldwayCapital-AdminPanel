import { Controller, Get, Injectable, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { LEAD_SOURCE_DEFS } from "../common/constants";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const [total, newLeads, contacted, appointmentSet, closed, overdue, upcoming, recruiting, syncErrors, pendingContent] =
      await Promise.all([
        this.prisma.lead.count(),
        this.prisma.lead.count({ where: { pipelineStage: "NEW" } }),
        this.prisma.lead.count({ where: { pipelineStage: "CONTACTED" } }),
        this.prisma.lead.count({ where: { pipelineStage: "APPOINTMENT_SET" } }),
        this.prisma.lead.count({ where: { pipelineStage: "CLOSED" } }),
        this.prisma.lead.count({ where: { nextFollowUpAt: { lt: now }, pipelineStage: { not: "CLOSED" } } }),
        this.prisma.appointment.count({ where: { scheduledAt: { gte: now }, status: "SCHEDULED" } }),
        this.prisma.lead.count({ where: { leadSource: "RECRUITING" } }),
        this.prisma.lead.count({ where: { ghlSyncStatus: "FAILED" } }),
        this.prisma.contentPost.count({ where: { status: "NEEDS_REVIEW" } }),
      ]);
    return { total, newLeads, contacted, appointmentSet, closed, overdue, upcoming, recruiting, syncErrors, pendingContent };
  }

  async leadsBySource() {
    const grouped = await this.prisma.lead.groupBy({ by: ["leadSource"], _count: { _all: true } });
    return LEAD_SOURCE_DEFS.map((d) => ({
      source: d.source,
      label: d.label,
      count: grouped.find((g) => g.leadSource === d.source)?._count._all ?? 0,
    }));
  }

  recentActivity() {
    return this.prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, firstName: true, lastName: true, leadSource: true, pipelineStage: true, ghlSyncStatus: true, createdAt: true },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("dashboard")
class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @RequirePermissions("leads.view") @Get("summary")
  summary() {
    return this.svc.summary();
  }
  @RequirePermissions("leads.view") @Get("leads-by-source")
  bySource() {
    return this.svc.leadsBySource();
  }
  @RequirePermissions("leads.view") @Get("recent-activity")
  recent() {
    return this.svc.recentActivity();
  }
}

@Module({ providers: [DashboardService], controllers: [DashboardController] })
export class DashboardModule {}
