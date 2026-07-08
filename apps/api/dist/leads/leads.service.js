"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const compliance_service_1 = require("../compliance/compliance.service");
const ghl_service_1 = require("../ghl/ghl.service");
const audit_service_1 = require("../audit/audit.service");
let LeadsService = class LeadsService {
    constructor(prisma, compliance, ghl, audit) {
        this.prisma = prisma;
        this.compliance = compliance;
        this.ghl = ghl;
        this.audit = audit;
    }
    async list(filter) {
        const where = {};
        if (filter.source)
            where.leadSource = filter.source;
        if (filter.stage)
            where.pipelineStage = filter.stage;
        if (filter.syncStatus)
            where.ghlSyncStatus = filter.syncStatus;
        if (filter.assignedToId)
            where.assignedToId = filter.assignedToId;
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
    async get(id) {
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
        if (!lead)
            throw new common_1.NotFoundException("Lead not found");
        return lead;
    }
    async update(id, dto, user) {
        await this.ensureExists(id);
        const data = {};
        if (dto.assignedToId !== undefined)
            data.assignedTo = dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true };
        if (dto.nextFollowUpAt !== undefined)
            data.nextFollowUpAt = dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null;
        if (dto.soaStatus !== undefined) {
            data.soaStatus = dto.soaStatus;
            data.soaCompletedAt = dto.soaStatus === "COMPLETED_EXTERNALLY" ? new Date() : null;
        }
        if (dto.recruitingStatus !== undefined)
            data.recruitingStatus = dto.recruitingStatus;
        if (dto.closedStatus !== undefined)
            data.closedStatus = dto.closedStatus;
        if (dto.closedReason !== undefined)
            data.closedReason = dto.closedReason;
        const lead = await this.prisma.lead.update({ where: { id }, data });
        await this.audit.log({ actorId: user.id, action: "lead.updated", entityType: "lead", entityId: id, metadata: { ...dto } });
        return lead;
    }
    async changeStage(id, stage, user) {
        const before = await this.prisma.lead.findUnique({ where: { id } });
        if (!before)
            throw new common_1.NotFoundException("Lead not found");
        await this.prisma.lead.update({
            where: { id },
            data: { pipelineStage: stage, lastContactedAt: stage === "CONTACTED" ? new Date() : before.lastContactedAt },
        });
        await this.audit.log({ actorId: user.id, action: "lead.stage_changed", entityType: "lead", entityId: id, metadata: { from: before.pipelineStage, to: stage } });
        const ghlSynced = await this.ghl.syncStage(id, stage);
        return { ok: true, ghlSynced, lead: await this.prisma.lead.findUnique({ where: { id } }) };
    }
    async addNote(id, dto, user) {
        await this.ensureExists(id);
        const complianceFlagged = this.compliance.looksLikeHealthInfo(dto.body);
        const note = await this.prisma.leadNote.create({ data: { leadId: id, authorId: user.id, body: dto.body, complianceFlagged } });
        await this.audit.log({ actorId: user.id, action: "note.added", entityType: "lead", entityId: id, metadata: { complianceFlagged } });
        return note;
    }
    async addCallLog(id, dto, user) {
        await this.ensureExists(id);
        const complianceFlagged = this.compliance.looksLikeHealthInfo(dto.notes);
        const log = await this.prisma.callLog.create({
            data: { leadId: id, authorId: user.id, outcome: dto.outcome, notes: dto.notes ?? null, followUpNeeded: !!dto.followUpNeeded, complianceFlagged },
        });
        await this.prisma.lead.update({ where: { id }, data: { lastContactedAt: new Date() } });
        await this.audit.log({ actorId: user.id, action: "call.logged", entityType: "lead", entityId: id, metadata: { outcome: dto.outcome, complianceFlagged } });
        return log;
    }
    async addEmailLog(id, dto, user) {
        await this.ensureExists(id);
        const log = await this.prisma.emailLog.create({
            data: { leadId: id, authorId: user.id, subject: dto.subject, body: dto.body, direction: dto.direction ?? "outbound", status: "sent" },
        });
        await this.audit.log({ actorId: user.id, action: "email.logged", entityType: "lead", entityId: id });
        return log;
    }
    async addTask(id, dto, user) {
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
    async addAppointment(id, dto, user) {
        await this.ensureExists(id);
        const appt = await this.prisma.appointment.create({
            data: { leadId: id, serviceType: dto.serviceType, scheduledAt: new Date(dto.scheduledAt), location: dto.location, notes: dto.notes },
        });
        await this.prisma.lead.update({ where: { id }, data: { pipelineStage: "APPOINTMENT_SET" } });
        await this.audit.log({ actorId: user.id, action: "appointment.created", entityType: "lead", entityId: id });
        return appt;
    }
    async ensureExists(id) {
        const exists = await this.prisma.lead.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new common_1.NotFoundException("Lead not found");
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compliance_service_1.ComplianceService,
        ghl_service_1.GhlService,
        audit_service_1.AuditService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map