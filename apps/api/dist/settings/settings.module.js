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
exports.SettingsModule = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const app_config_service_1 = require("../config/app-config.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
class UpdateSettingsDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateSettingsDto.prototype, "settings", void 0);
let SettingsService = class SettingsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async all() {
        const settings = await this.prisma.setting.findMany({ where: { isSecret: false }, orderBy: { category: "asc" } });
        return {
            settings,
            integrations: {
                ghl: { enabled: this.config.ghl.enabled, mockMode: this.config.ghl.mockMode, live: this.config.ghlLive(), tokenConfigured: !!this.config.ghl.token, locationConfigured: !!this.config.ghl.locationId, pipelineConfigured: !!this.config.ghl.pipelineId },
                social: { enabled: this.config.social.enabled, mockMode: this.config.social.mockMode, live: this.config.socialLive() },
                email: { provider: this.config.email.provider, sharedMailbox: this.config.email.sharedMailbox },
                compliance: this.config.compliance,
            },
        };
    }
    async update(dto) {
        for (const s of dto.settings) {
            await this.prisma.setting.updateMany({ where: { key: s.key, isSecret: false }, data: { value: s.value } });
        }
        return this.all();
    }
};
SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, app_config_service_1.AppConfigService])
], SettingsService);
let SettingsController = class SettingsController {
    constructor(svc) {
        this.svc = svc;
    }
    get() {
        return this.svc.all();
    }
    update(dto) {
        return this.svc.update(dto);
    }
};
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("settings.manage"),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "get", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)("settings.manage"),
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateSettingsDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "update", null);
SettingsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("settings"),
    __metadata("design:paramtypes", [SettingsService])
], SettingsController);
let SettingsModule = class SettingsModule {
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = __decorate([
    (0, common_1.Module)({ providers: [SettingsService], controllers: [SettingsController] })
], SettingsModule);
//# sourceMappingURL=settings.module.js.map