import { Controller, Get, Injectable, Module, Param, Post, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { AuditService } from "../audit/audit.service";

/** Small read/utility endpoints: users (for assignment), tasks, appointments, recruiting. */
@Injectable()
class MiscService {
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
class MiscController {
  constructor(private readonly svc: MiscService) {}

  @RequirePermissions("leads.view") @Get("users")
  users() {
    return this.svc.users();
  }
  @RequirePermissions("tasks.manage") @Get("tasks")
  tasks() {
    return this.svc.openTasks();
  }
  @RequirePermissions("tasks.manage") @Post("tasks/:id/complete")
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.svc.completeTask(id, user);
  }
  @RequirePermissions("appointments.manage") @Get("appointments")
  appointments(@Query("service") service?: string) {
    return this.svc.appointments(service);
  }
  @RequirePermissions("leads.view") @Get("recruiting")
  recruiting() {
    return this.svc.recruiting();
  }
}

@Module({ providers: [MiscService], controllers: [MiscController] })
export class MiscModule {}
