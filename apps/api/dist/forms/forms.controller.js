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
exports.FormsController = void 0;
const common_1 = require("@nestjs/common");
const forms_service_1 = require("./forms.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const app_config_service_1 = require("../config/app-config.service");
let FormsController = class FormsController {
    constructor(forms, config) {
        this.forms = forms;
        this.config = config;
    }
    assertKey(key) {
        if (this.config.leadApiIngestKey && key !== this.config.leadApiIngestKey) {
            throw new common_1.ForbiddenException("Invalid ingest key");
        }
    }
    ctx(req) {
        return {
            ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.ip ?? null,
            userAgent: req.headers["user-agent"] ?? null,
        };
    }
    handle(source, dto, req, key) {
        this.assertKey(key);
        return this.forms.intake(source, dto, req.body, this.ctx(req));
    }
    medicare(dto, req, key) {
        return this.handle("MEDICARE", dto, req, key);
    }
    finalExpense(dto, req, key) {
        return this.handle("FINAL_EXPENSE", dto, req, key);
    }
    reverse(dto, req, key) {
        return this.handle("REVERSE_MTG", dto, req, key);
    }
    probate(dto, req, key) {
        return this.handle("PROBATE", dto, req, key);
    }
    recruiting(dto, req, key) {
        return this.handle("RECRUITING", dto, req, key);
    }
};
exports.FormsController = FormsController;
__decorate([
    (0, common_1.Post)("medicare"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("x-goldway-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "medicare", null);
__decorate([
    (0, common_1.Post)("final-expense"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("x-goldway-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "finalExpense", null);
__decorate([
    (0, common_1.Post)("reverse-mortgage"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("x-goldway-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "reverse", null);
__decorate([
    (0, common_1.Post)("probate"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("x-goldway-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "probate", null);
__decorate([
    (0, common_1.Post)("recruiting"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("x-goldway-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "recruiting", null);
exports.FormsController = FormsController = __decorate([
    (0, common_1.Controller)("forms"),
    __metadata("design:paramtypes", [forms_service_1.FormsService, app_config_service_1.AppConfigService])
], FormsController);
//# sourceMappingURL=forms.controller.js.map