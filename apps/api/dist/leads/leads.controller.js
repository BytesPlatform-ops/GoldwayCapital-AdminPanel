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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./leads.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const lead_dtos_1 = require("./dto/lead-dtos");
let LeadsController = class LeadsController {
    constructor(leads) {
        this.leads = leads;
    }
    list(q, source, stage, syncStatus, assignedToId) {
        return this.leads.list({ q, source, stage, syncStatus, assignedToId });
    }
    get(id) {
        return this.leads.get(id);
    }
    update(id, dto, user) {
        return this.leads.update(id, dto, user);
    }
    stage(id, dto, user) {
        return this.leads.changeStage(id, dto.stage, user);
    }
    note(id, dto, user) {
        return this.leads.addNote(id, dto, user);
    }
    call(id, dto, user) {
        return this.leads.addCallLog(id, dto, user);
    }
    emailLog(id, dto, user) {
        return this.leads.addEmailLog(id, dto, user);
    }
    task(id, dto, user) {
        return this.leads.addTask(id, dto, user);
    }
    appointment(id, dto, user) {
        return this.leads.addAppointment(id, dto, user);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("source")),
    __param(2, (0, common_1.Query)("stage")),
    __param(3, (0, common_1.Query)("syncStatus")),
    __param(4, (0, common_1.Query)("assignedToId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.view"),
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "get", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.update"),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("leads.stage_change"),
    (0, common_1.Patch)(":id/stage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.UpdateStageDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "stage", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("notes.create"),
    (0, common_1.Post)(":id/notes"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.CreateNoteDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "note", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("calls.create"),
    (0, common_1.Post)(":id/call-logs"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.CreateCallLogDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "call", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("emails.send"),
    (0, common_1.Post)(":id/email-logs"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.CreateEmailLogDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "emailLog", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("tasks.manage"),
    (0, common_1.Post)(":id/tasks"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "task", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("appointments.manage"),
    (0, common_1.Post)(":id/appointments"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dtos_1.CreateAppointmentDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "appointment", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("leads"),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map