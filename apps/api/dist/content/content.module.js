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
exports.ContentModule = void 0;
const common_1 = require("@nestjs/common");
const content_service_1 = require("./content.service");
const social_module_1 = require("../social/social.module");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const content_dto_1 = require("./content.dto");
let PublicContentController = class PublicContentController {
    constructor(content) {
        this.content = content;
    }
    list() {
        return this.content.publishedList();
    }
    bySlug(slug) {
        return this.content.publishedBySlug(slug);
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicContentController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":slug"),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicContentController.prototype, "bySlug", null);
PublicContentController = __decorate([
    (0, common_1.Controller)("public/resource-center"),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], PublicContentController);
let ContentController = class ContentController {
    constructor(content) {
        this.content = content;
    }
    list() {
        return this.content.list();
    }
    get(id) {
        return this.content.get(id);
    }
    create(dto, user) {
        return this.content.create(dto, user);
    }
    update(id, dto, user) {
        return this.content.update(id, dto, user);
    }
    submit(id, user) {
        return this.content.submitForReview(id, user);
    }
    approve(id, user) {
        return this.content.approve(id, user);
    }
    publish(id, dto, user) {
        return this.content.publish(id, dto, user);
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.create"),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.create"),
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "get", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.create"),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [content_dto_1.CreateContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.create"),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, content_dto_1.UpdateContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.create"),
    (0, common_1.Post)(":id/submit-review"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "submit", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.review"),
    (0, common_1.Post)(":id/approve"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "approve", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("content.publish"),
    (0, common_1.Post)(":id/publish"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, content_dto_1.PublishContentDto, Object]),
    __metadata("design:returntype", void 0)
], ContentController.prototype, "publish", null);
ContentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("content"),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
let ContentModule = class ContentModule {
};
exports.ContentModule = ContentModule;
exports.ContentModule = ContentModule = __decorate([
    (0, common_1.Module)({ imports: [social_module_1.SocialModule], providers: [content_service_1.ContentService], controllers: [ContentController, PublicContentController] })
], ContentModule);
//# sourceMappingURL=content.module.js.map