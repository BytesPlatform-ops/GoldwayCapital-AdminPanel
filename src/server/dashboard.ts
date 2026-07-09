import type { PrismaService } from "@/db/prisma";
import { LEAD_SOURCE_DEFS } from "@/lib/constants";

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
