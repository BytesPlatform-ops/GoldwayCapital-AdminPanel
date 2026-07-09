import type { PrismaService } from "@/db/prisma";
import type { AuditService } from "@/server/audit";
import type { AuthUser } from "@/types";

/** Small read/utility operations: users (for assignment), tasks, appointments, recruiting. */
export class MiscService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  users() {
    return this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } });
  }

  openTasks() {
    return this.prisma.followUpTask.findMany({
      where: { status: "OPEN" },
      orderBy: { dueAt: "asc" },
      include: { lead: { select: { id: true, firstName: true, lastName: true } }, assignedTo: { select: { name: true } } },
      take: 200,
    });
  }

  async completeTask(id: string, user: AuthUser) {
    await this.prisma.followUpTask.update({ where: { id }, data: { status: "DONE", completedAt: new Date() } });
    await this.audit.log({ actorId: user.id, action: "task.completed", entityType: "task", entityId: id });
    return { ok: true };
  }

  appointments(service?: string) {
    return this.prisma.appointment.findMany({
      where: { ...(service ? { serviceType: service } : {}), scheduledAt: { gte: new Date(Date.now() - 86400000) } },
      orderBy: { scheduledAt: "asc" },
      include: { lead: { select: { id: true, firstName: true, lastName: true, soaStatus: true } } },
      take: 200,
    });
  }

  recruiting() {
    return this.prisma.lead.findMany({
      where: { leadSource: "RECRUITING" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
