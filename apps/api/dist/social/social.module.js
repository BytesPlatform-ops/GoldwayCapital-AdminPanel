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
exports.SocialModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const social_service_1 = require("./social.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
class PublishDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishDto.prototype, "contentPostId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], PublishDto.prototype, "platforms", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishDto.prototype, "caption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishDto.prototype, "scheduledAt", void 0);
let SocialController = class SocialController {
    constructor(social) {
        this.social = social;
    }
    publish(dto) {
        return this.social.publish(dto.contentPostId, dto.platforms, dto.caption);
    }
    schedule(dto) {
        return this.social.publish(dto.contentPostId, dto.platforms, dto.caption, dto.scheduledAt);
    }
    retry(id) {
        return this.social.retry(id);
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.publish"),
    (0, common_1.Post)("publish"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublishDto]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "publish", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.publish"),
    (0, common_1.Post)("schedule"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublishDto]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "schedule", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.publish"),
    (0, common_1.Post)("retry/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "retry", null);
SocialController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("social"),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
let SocialModule = class SocialModule {
};
exports.SocialModule = SocialModule;
exports.SocialModule = SocialModule = __decorate([
    (0, common_1.Module)({ providers: [social_service_1.SocialService], controllers: [SocialController], exports: [social_service_1.SocialService] })
], SocialModule);
//# sourceMappingURL=social.module.js.map