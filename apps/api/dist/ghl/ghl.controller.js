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
exports.GhlController = void 0;
const common_1 = require("@nestjs/common");
const ghl_service_1 = require("./ghl.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let GhlController = class GhlController {
    constructor(ghl) {
        this.ghl = ghl;
    }
    status() {
        return this.ghl.status();
    }
    syncLead(id) {
        return this.ghl.syncLead(id);
    }
    retryFailed() {
        return this.ghl.retryFailed();
    }
};
exports.GhlController = GhlController;
__decorate([
    (0, common_1.Get)("status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GhlController.prototype, "status", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("sync-lead/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GhlController.prototype, "syncLead", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("integrations.manage"),
    (0, common_1.Post)("retry-failed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GhlController.prototype, "retryFailed", null);
exports.GhlController = GhlController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("ghl"),
    __metadata("design:paramtypes", [ghl_service_1.GhlService])
], GhlController);
//# sourceMappingURL=ghl.controller.js.map