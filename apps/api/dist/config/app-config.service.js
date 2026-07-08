"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = void 0;
const common_1 = require("@nestjs/common");
function bool(v, def = false) {
    if (v === undefined)
        return def;
    return v === "true" || v === "1" || v === "yes";
}
function str(v, def = "") {
    return v ?? def;
}
let AppConfigService = class AppConfigService {
    constructor() {
        this.jwtSecret = str(process.env.JWT_SECRET, "dev-insecure-jwt-secret-change-me-please-32bytes");
        this.leadApiIngestKey = str(process.env.LEAD_API_INGEST_KEY);
        this.ghl = {
            enabled: bool(process.env.GHL_ENABLED),
            mockMode: bool(process.env.GHL_MOCK_MODE, true),
            baseUrl: str(process.env.GHL_API_BASE_URL, "https://services.leadconnectorhq.com"),
            token: str(process.env.GHL_PRIVATE_INTEGRATION_TOKEN),
            locationId: str(process.env.GHL_LOCATION_ID),
            pipelineId: str(process.env.GHL_PIPELINE_ID),
            webhookSecret: str(process.env.GHL_WEBHOOK_SECRET),
            stageIds: {
                NEW: str(process.env.GHL_STAGE_NEW_ID),
                CONTACTED: str(process.env.GHL_STAGE_CONTACTED_ID),
                APPOINTMENT_SET: str(process.env.GHL_STAGE_APPOINTMENT_SET_ID),
                CLOSED: str(process.env.GHL_STAGE_CLOSED_ID),
            },
        };
        this.social = {
            enabled: bool(process.env.SOCIAL_PUBLISHING_ENABLED),
            mockMode: bool(process.env.SOCIAL_MOCK_MODE, true),
            ghlPlanner: bool(process.env.GHL_SOCIAL_PLANNER_ENABLED),
        };
        this.email = {
            provider: str(process.env.EMAIL_PROVIDER, "mock"),
            fromEmail: str(process.env.FROM_EMAIL, "leads@goldwaycapital.com"),
            fromName: str(process.env.FROM_NAME, "Goldway Capital"),
            sharedMailbox: str(process.env.M365_SHARED_MAILBOX, "leads@goldwaycapital.com"),
        };
        this.compliance = {
            reviewRequired: bool(process.env.COMPLIANCE_REVIEW_REQUIRED, true),
            blockHealthFields: bool(process.env.BLOCK_HEALTH_INFO_FIELDS, true),
        };
    }
    ghlLive() {
        return this.ghl.enabled && !this.ghl.mockMode && !!this.ghl.token && !!this.ghl.locationId;
    }
    socialLive() {
        return this.social.enabled && !this.social.mockMode;
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)()
], AppConfigService);
//# sourceMappingURL=app-config.service.js.map