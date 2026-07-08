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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const compliance_service_1 = require("./compliance.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
class CheckContentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckContentDto.prototype, "text", void 0);
class UpdateDisclosureDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDisclosureDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDisclosureDto.prototype, "body", void 0);
let ComplianceController = class ComplianceController {
    constructor(compliance, prisma) {
        this.compliance = compliance;
        this.prisma = prisma;
    }
    check(dto) {
        return this.compliance.scanText(dto.text ?? "");
    }
    rules() {
        return this.compliance.getRules();
    }
    disclosures() {
        return this.compliance.getDisclosures();
    }
    updateDisclosure(id, dto) {
        return this.prisma.disclosureBlock.update({ where: { id }, data: { title: dto.title, body: dto.body } });
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Post)("check-content"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckContentDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "check", null);
__decorate([
    (0, common_1.Get)("rules"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "rules", null);
__decorate([
    (0, common_1.Get)("disclosures"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "disclosures", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, permissions_decorator_1.RequirePermissions)("compliance.manage"),
    (0, common_1.Patch)("disclosures/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDisclosureDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "updateDisclosure", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.Controller)("compliance"),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService, prisma_service_1.PrismaService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map