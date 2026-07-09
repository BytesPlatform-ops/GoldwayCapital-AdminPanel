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
            workflowIds: {
                MEDICARE: str(process.env.GHL_WORKFLOW_MEDICARE_CONFIRMATION_ID),
                FINAL_EXPENSE: str(process.env.GHL_WORKFLOW_FINAL_EXPENSE_CONFIRMATION_ID),
                REVERSE_MTG: str(process.env.GHL_WORKFLOW_REVERSE_MTG_CONFIRMATION_ID),
                PROBATE: str(process.env.GHL_WORKFLOW_PROBATE_CONFIRMATION_ID),
                RECRUITING: str(process.env.GHL_WORKFLOW_RECRUITING_CONFIRMATION_ID),
            },
            assignedUsers: {
                owner: str(process.env.GHL_ASSIGNED_USER_OWNER_ID),
                va: str(process.env.GHL_ASSIGNED_USER_VA_ID),
            },
        };
        this.social = {
            enabled: bool(process.env.SOCIAL_PUBLISHING_ENABLED),
            mockMode: bool(process.env.SOCIAL_MOCK_MODE, true),
            ghlPlanner: bool(process.env.GHL_SOCIAL_PLANNER_ENABLED),
            accountIds: {
                FACEBOOK: str(process.env.GHL_SOCIAL_FACEBOOK_ACCOUNT_ID) || str(process.env.FACEBOOK_PAGE_ID),
                INSTAGRAM: str(process.env.GHL_SOCIAL_INSTAGRAM_ACCOUNT_ID) || str(process.env.INSTAGRAM_ACCOUNT_ID),
                LINKEDIN: str(process.env.GHL_SOCIAL_LINKEDIN_ACCOUNT_ID) || str(process.env.LINKEDIN_ORGANIZATION_ID),
            },
            googleBusinessProfileId: str(process.env.GHL_SOCIAL_GOOGLE_BUSINESS_PROFILE_ID),
        };
        this.wordpress = {
            enabled: bool(process.env.WORDPRESS_ENABLED),
            mockMode: bool(process.env.WORDPRESS_MOCK_MODE, true),
            baseUrl: str(process.env.WORDPRESS_BASE_URL).replace(/\/+$/, ""),
            username: str(process.env.WORDPRESS_USERNAME),
            appPassword: str(process.env.WORDPRESS_APPLICATION_PASSWORD),
            authorId: str(process.env.WORDPRESS_DEFAULT_AUTHOR_ID),
            categoryId: str(process.env.WORDPRESS_RESOURCE_CATEGORY_ID),
            statusDefault: str(process.env.WORDPRESS_STATUS_DEFAULT, "draft"),
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
        return this.social.enabled && !this.social.mockMode && !!this.ghl.token && !!this.ghl.locationId;
    }
    wordpressLive() {
        return (this.wordpress.enabled &&
            !this.wordpress.mockMode &&
            !!this.wordpress.baseUrl &&
            !!this.wordpress.username &&
            !!this.wordpress.appPassword);
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)()
], AppConfigService);
//# sourceMappingURL=app-config.service.js.map