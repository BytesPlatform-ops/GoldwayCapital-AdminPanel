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
exports.DashboardModule = exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const constants_1 = require("../common/constants");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary() {
        const now = new Date();
        const [total, newLeads, contacted, appointmentSet, closed, overdue, upcoming, recruiting, syncErrors, pendingContent] = await Promise.all([
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
        return constants_1.LEAD_SOURCE_DEFS.map((d) => ({
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
let DashboardController = class DashboardController {
    constructor(svc) {
        this.svc = svc;
    }
    summary() {
        return this.svc.summary();
    }
    bySource() {
        return this.svc.leadsBySource();
    }
    recent() {
        return this.svc.recentActivity();
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)("summary"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "summary", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)("leads-by-source"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "bySource", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)("recent-activity"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "recent", null);
DashboardController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("dashboard"),
    __metadata("design:paramtypes", [DashboardService])
], DashboardController);
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_2.Module)({ providers: [DashboardService], controllers: [DashboardController] })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map