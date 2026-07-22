import type { PrismaService } from "@/db/prisma";
import type { AuditService } from "@/server/audit";
import type { GhlService } from "@/integrations/ghl/ghl.service";
import type { AuthUser } from "@/types";
import { NotFoundException } from "@/lib/nest";

/** Small read/utility operations: users (for assignment), tasks, appointments, recruiting. */
export class MiscService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly ghl: GhlService) {}

  users() {
    return this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, role: true }, orderBy: { name: "asc" } });
  }

  /**
   * Follow-up tasks for the Tasks page. Filtered by status: "open" (default) shows
   * pending work, "completed" shows the done record (VA audit trail), "all" shows
   * both. Completed tasks are ordered by most-recently-completed.
   */
  tasks(filter?: string) {
    const status = filter === "completed" ? "completed" : filter === "all" ? "all" : "open";
    const where = status === "all" ? {} : { status: status === "completed" ? ("DONE" as const) : ("OPEN" as const) };
    return this.prisma.followUpTask.findMany({
      where,
      orderBy: status === "completed" ? { completedAt: "desc" } : { dueAt: "asc" },
      include: { lead: { select: { id: true, firstName: true, lastName: true } }, assignedTo: { select: { name: true } } },
      take: 200,
    });
  }

  async completeTask(id: string, user: AuthUser) {
    const task = await this.prisma.followUpTask.update({
      where: { id },
      data: { status: "DONE", completedAt: new Date() },
      select: { id: true, ghlTaskId: true, lead: { select: { id: true, ghlContactId: true } } },
    });
    await this.audit.log({ actorId: user.id, action: "task.completed", entityType: "task", entityId: id });
    // Mirror completion to GHL (panel → GHL). Best-effort: only when this task was
    // pushed to GHL (ghlTaskId) and its lead has a contact id.
    if (task.ghlTaskId && task.lead?.ghlContactId) {
      await this.ghl.completeTask(task.lead.id, task.lead.ghlContactId, task.ghlTaskId).catch(() => undefined);
    }
    return { ok: true };
  }

  async deleteTask(id: string, user: AuthUser) {
    const task = await this.prisma.followUpTask.findUnique({ where: { id }, select: { id: true } });
    if (!task) throw new NotFoundException("Task not found");
    await this.prisma.followUpTask.delete({ where: { id } });
    await this.audit.log({ actorId: user.id, action: "task.deleted", entityType: "task", entityId: id });
    return { ok: true };
  }

  async deleteAppointment(id: string, user: AuthUser) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, select: { id: true } });
    if (!appt) throw new NotFoundException("Appointment not found");
    await this.prisma.appointment.delete({ where: { id } });
    await this.audit.log({ actorId: user.id, action: "appointment.deleted", entityType: "appointment", entityId: id });
    return { ok: true };
  }

  appointments(service?: string) {
    // serviceType is a free-form calendar name (e.g. "Final Expense Consultation"),
    // so filter by a case-insensitive contains rather than an exact slug match.
    const term = service?.trim();
    return this.prisma.appointment.findMany({
      where: {
        ...(term ? { serviceType: { contains: term, mode: "insensitive" } } : {}),
        scheduledAt: { gte: new Date(Date.now() - 86400000) },
      },
      orderBy: { scheduledAt: "asc" },
      include: { lead: { select: { id: true, firstName: true, lastName: true, soaStatus: true } } },
      take: 200,
    });
  }

  /** Distinct service names actually present — drives the Appointments filter dropdown. */
  async appointmentServiceTypes(): Promise<string[]> {
    const rows = await this.prisma.appointment.findMany({
      distinct: ["serviceType"],
      select: { serviceType: true },
      orderBy: { serviceType: "asc" },
    });
    return rows.map((r) => r.serviceType);
  }

  /** Full detail for a single appointment, including its lead. */
  async appointment(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            city: true, state: true, zipCode: true, soaStatus: true,
            pipelineStage: true, leadSource: true, ghlContactId: true,
          },
        },
      },
    });
    if (!appt) throw new NotFoundException("Appointment not found");
    return appt;
  }

  recruiting() {
    return this.prisma.lead.findMany({
      where: { leadSource: "RECRUITING" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  /**
   * Recent activity feed for the header notification bell. Derived on the fly from
   * real records (new leads, new appointments, failed syncs) — no separate table.
   * The client decides which are "unread" by comparing createdAt to its last-seen mark.
   */
  async notifications(): Promise<NotificationItem[]> {
    const since = new Date(Date.now() - 14 * 86400000);
    const [leads, appts, failed] = await Promise.all([
      this.prisma.lead.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: { id: true, firstName: true, lastName: true, leadSource: true, createdAt: true },
      }),
      this.prisma.appointment.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: { id: true, serviceType: true, createdAt: true, lead: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.lead.findMany({
        where: { ghlSyncStatus: "FAILED", updatedAt: { gte: since } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, firstName: true, lastName: true, updatedAt: true },
      }),
    ]);

    const prettySource = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const items: NotificationItem[] = [
      ...leads.map((l) => ({ id: `lead:${l.id}`, type: "lead" as const, title: "New lead", detail: `${l.firstName} ${l.lastName} · ${prettySource(l.leadSource)}`, href: `/admin/leads/${l.id}`, createdAt: l.createdAt.toISOString() })),
      ...appts.map((a) => ({ id: `appt:${a.id}`, type: "appointment" as const, title: "New appointment", detail: `${a.serviceType} · ${a.lead.firstName} ${a.lead.lastName}`, href: `/admin/appointments/${a.id}`, createdAt: a.createdAt.toISOString() })),
      ...failed.map((l) => ({ id: `sync:${l.id}`, type: "alert" as const, title: "Lead sync failed", detail: `${l.firstName} ${l.lastName}`, href: `/admin/leads/${l.id}`, createdAt: l.updatedAt.toISOString() })),
    ];
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items.slice(0, 25);
  }
}

export interface NotificationItem {
  id: string;
  type: "lead" | "appointment" | "alert";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}
