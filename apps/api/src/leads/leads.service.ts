import { Injectable, NotFoundException } from "@nestjs/common";
import type { GhlSyncStatus, LeadSource, PipelineStage, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ComplianceService } from "../compliance/compliance.service";
import { GhlService } from "../ghl/ghl.service";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/current-user.decorator";
import {
  CreateAppointmentDto,
  CreateCallLogDto,
  CreateEmailLogDto,
  CreateNoteDto,
  CreateTaskDto,
  UpdateLeadDto,
} from "./dto/lead-dtos";

export interface LeadFilter {
  q?: string;
  source?: LeadSource;
  stage?: PipelineStage;
  syncStatus?: GhlSyncStatus;
  assignedToId?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly ghl: GhlService,
    private readonly audit: AuditService
  ) {}

  async list(filter: LeadFilter) {
    const where: Prisma.LeadWhereInput = {};
    if (filter.source) where.leadSource = filter.source;
    if (filter.stage) where.pipelineStage = filter.stage;
    if (filter.syncStatus) where.ghlSyncStatus = filter.syncStatus;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter.q) {
      where.OR = [
        { firstName: { contains: filter.q, mode: "insensitive" } },
        { lastName: { contains: filter.q, mode: "insensitive" } },
        { email: { contains: filter.q, mode: "insensitive" } },
        { phone: { contains: filter.q } },
      ];
    }
    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { assignedTo: { select: { id: true, name: true } } },
    });
  }

  async get(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
        callLogs: { orderBy: { occurredAt: "desc" }, include: { author: { select: { name: true } } } },
        emailLogs: { orderBy: { createdAt: "desc" } },
        followUpTasks: { orderBy: { createdAt: "desc" }, include: { assignedTo: { select: { name: true } } } },
        appointments: { orderBy: { scheduledAt: "desc" } },
      },
    });
    if (!lead) throw new NotFoundException("Lead not found");
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: AuthUser) {
    await this.ensureExists(id);
    const data: Prisma.LeadUpdateInput = {};
    if (dto.assignedToId !== undefined) data.assignedTo = dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true };
    if (dto.nextFollowUpAt !== undefined) data.nextFollowUpAt = dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null;
    if (dto.soaStatus !== undefined) {
      data.soaStatus = dto.soaStatus;
      data.soaCompletedAt = dto.soaStatus === "COMPLETED_EXTERNALLY" ? new Date() : null;
    }
    if (dto.recruitingStatus !== undefined) data.recruitingStatus = dto.recruitingStatus;
    if (dto.closedStatus !== undefined) data.closedStatus = dto.closedStatus;
    if (dto.closedReason !== undefined) data.closedReason = dto.closedReason;

    const lead = await this.prisma.lead.update({ where: { id }, data });
    await this.audit.log({ actorId: user.id, action: "lead.updated", entityType: "lead", entityId: id, metadata: { ...dto } });
    return lead;
  }

  async changeStage(id: string, stage: PipelineStage, user: AuthUser) {
    const before = await this.prisma.lead.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Lead not found");
    await this.prisma.lead.update({
      where: { id },
      data: { pipelineStage: stage, lastContactedAt: stage === "CONTACTED" ? new Date() : before.lastContactedAt },
    });
    await this.audit.log({ actorId: user.id, action: "lead.stage_changed", entityType: "lead", entityId: id, metadata: { from: before.pipelineStage, to: stage } });
    const ghlSynced = await this.ghl.syncStage(id, stage);
    return { ok: true, ghlSynced, lead: await this.prisma.lead.findUnique({ where: { id } }) };
  }

  async addNote(id: string, dto: CreateNoteDto, user: AuthUser) {
    await this.ensureExists(id);
    const complianceFlagged = this.compliance.looksLikeHealthInfo(dto.body);
    const note = await this.prisma.leadNote.create({ data: { leadId: id, authorId: user.id, body: dto.body, complianceFlagged } });
    await this.audit.log({ actorId: user.id, action: "note.added", entityType: "lead", entityId: id, metadata: { complianceFlagged } });
    return note;
  }

  async addCallLog(id: string, dto: CreateCallLogDto, user: AuthUser) {
    await this.ensureExists(id);
    const complianceFlagged = this.compliance.looksLikeHealthInfo(dto.notes);
    const log = await this.prisma.callLog.create({
      data: { leadId: id, authorId: user.id, outcome: dto.outcome, notes: dto.notes ?? null, followUpNeeded: !!dto.followUpNeeded, complianceFlagged },
    });
    await this.prisma.lead.update({ where: { id }, data: { lastContactedAt: new Date() } });
    await this.audit.log({ actorId: user.id, action: "call.logged", entityType: "lead", entityId: id, metadata: { outcome: dto.outcome, complianceFlagged } });
    return log;
  }

  async addEmailLog(id: string, dto: CreateEmailLogDto, user: AuthUser) {
    await this.ensureExists(id);
    const log = await this.prisma.emailLog.create({
      data: { leadId: id, authorId: user.id, subject: dto.subject, body: dto.body, direction: dto.direction ?? "outbound", status: "sent" },
    });
    await this.audit.log({ actorId: user.id, action: "email.logged", entityType: "lead", entityId: id });
    return log;
  }

  async addTask(id: string | null, dto: CreateTaskDto, user: AuthUser) {
    const task = await this.prisma.followUpTask.create({
      data: {
        leadId: id,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        assignedToId: dto.assignedToId ?? null,
        createdById: user.id,
      },
    });
    await this.audit.log({ actorId: user.id, action: "task.created", entityType: "lead", entityId: id ?? undefined });
    return task;
  }

  async addAppointment(id: string, dto: CreateAppointmentDto, user: AuthUser) {
    await this.ensureExists(id);
    const appt = await this.prisma.appointment.create({
      data: { leadId: id, serviceType: dto.serviceType, scheduledAt: new Date(dto.scheduledAt), location: dto.location, notes: dto.notes },
    });
    await this.prisma.lead.update({ where: { id }, data: { pipelineStage: "APPOINTMENT_SET" } });
    await this.audit.log({ actorId: user.id, action: "appointment.created", entityType: "lead", entityId: id });
    return appt;
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Lead not found");
  }
}
