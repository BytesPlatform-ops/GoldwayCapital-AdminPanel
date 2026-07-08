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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const audit_service_1 = require("../audit/audit.service");
let MiscService = class MiscService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
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
    async completeTask(id, user) {
        await this.prisma.followUpTask.update({ where: { id }, data: { status: "DONE", completedAt: new Date() } });
        await this.audit.log({ actorId: user.id, action: "task.completed", entityType: "task", entityId: id });
        return { ok: true };
    }
    appointments(service) {
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
};
MiscService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], MiscService);
let MiscController = class MiscController {
    constructor(svc) {
        this.svc = svc;
    }
    users() {
        return this.svc.users();
    }
    tasks() {
        return this.svc.openTasks();
    }
    complete(id, user) {
        return this.svc.completeTask(id, user);
    }
    appointments(service) {
        return this.svc.appointments(service);
    }
    recruiting() {
        return this.svc.recruiting();
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)("users"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MiscController.prototype, "users", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("tasks.manage"),
    (0, common_1.Get)("tasks"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MiscController.prototype, "tasks", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("tasks.manage"),
    (0, common_1.Post)("tasks/:id/complete"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MiscController.prototype, "complete", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("appointments.manage"),
    (0, common_1.Get)("appointments"),
    __param(0, (0, common_1.Query)("service")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MiscController.prototype, "appointments", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)("recruiting"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MiscController.prototype, "recruiting", null);
MiscController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [MiscService])
], MiscController);
let MiscModule = class MiscModule {
};
exports.MiscModule = MiscModule;
exports.MiscModule = MiscModule = __decorate([
    (0, common_1.Module)({ providers: [MiscService], controllers: [MiscController] })
], MiscModule);
//# sourceMappingURL=misc.module.js.map