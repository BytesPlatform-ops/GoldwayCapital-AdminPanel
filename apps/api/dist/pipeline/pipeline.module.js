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
exports.PipelineModule = exports.PipelineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const leads_service_1 = require("../leads/leads.service");
const leads_module_1 = require("../leads/leads.module");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const lead_dtos_1 = require("../leads/dto/lead-dtos");
let PipelineService = class PipelineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    board() {
        return this.prisma.lead.findMany({
            where: { leadSource: { not: "RECRUITING" } },
            orderBy: { createdAt: "desc" },
            take: 400,
            select: { id: true, firstName: true, lastName: true, leadSource: true, pipelineStage: true, ghlSyncStatus: true },
        });
    }
};
exports.PipelineService = PipelineService;
exports.PipelineService = PipelineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PipelineService);
let PipelineController = class PipelineController {
    constructor(svc, leads) {
        this.svc = svc;
        this.leads = leads;
    }
    board() {
        return this.svc.board();
    }
    move(id, dto, user) {
        return this.leads.changeStage(id, dto.stage, user);
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "board", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.stage_change"),
    (0, common_1.Patch)("leads/:id/move"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.UpdateStageDto, Object]),
    __metadata("design:returntype", void 0)
], PipelineController.prototype, "move", null);
PipelineController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("pipeline"),
    __metadata("design:paramtypes", [PipelineService, leads_service_1.LeadsService])
], PipelineController);
let PipelineModule = class PipelineModule {
};
exports.PipelineModule = PipelineModule;
exports.PipelineModule = PipelineModule = __decorate([
    (0, common_1.Module)({ imports: [leads_module_1.LeadsModule], providers: [PipelineService], controllers: [PipelineController] })
], PipelineModule);
//# sourceMappingURL=pipeline.module.js.map