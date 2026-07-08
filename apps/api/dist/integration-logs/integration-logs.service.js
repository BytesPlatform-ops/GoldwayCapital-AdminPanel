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
exports.IntegrationLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IntegrationLogsService = class IntegrationLogsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger("IntegrationLog");
    }
    async record(params) {
        try {
            await this.prisma.integrationLog.create({
                data: {
                    provider: params.provider,
                    operation: params.operation,
                    status: params.status,
                    relatedType: params.relatedType,
                    relatedId: params.relatedId,
                    request: params.request,
                    response: params.response,
                    attempt: params.attempt ?? 1,
                    durationMs: params.durationMs,
                },
            });
        }
        catch (err) {
            this.logger.error(`integration log write failed: ${err}`);
        }
    }
    list(take = 50) {
        return this.prisma.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take });
    }
    async withRetry(fn, attempts = 3, baseDelayMs = 300) {
        let lastErr;
        for (let i = 1; i <= attempts; i++) {
            try {
                return await fn(i);
            }
            catch (err) {
                lastErr = err;
                if (i < attempts)
                    await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (i - 1)));
            }
        }
        throw lastErr;
    }
};
exports.IntegrationLogsService = IntegrationLogsService;
exports.IntegrationLogsService = IntegrationLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrationLogsService);
//# sourceMappingURL=integration-logs.service.js.map