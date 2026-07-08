import { Injectable } from "@nestjs/common";

function bool(v: string | undefined, def = false): boolean {
  if (v === undefined) return def;
  return v === "true" || v === "1" || v === "yes";
}
function str(v: string | undefined, def = ""): string {
  return v ?? def;
}

/** Typed, centralized environment access. Nothing hardcoded elsewhere. */
@Injectable()
export class AppConfigService {
  readonly jwtSecret = str(process.env.JWT_SECRET, "dev-insecure-jwt-secret-change-me-please-32bytes");
  readonly leadApiIngestKey = str(process.env.LEAD_API_INGEST_KEY);

  readonly ghl = {
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
    } as Record<string, string>,
  };

  readonly social = {
    enabled: bool(process.env.SOCIAL_PUBLISHING_ENABLED),
    mockMode: bool(process.env.SOCIAL_MOCK_MODE, true),
    ghlPlanner: bool(process.env.GHL_SOCIAL_PLANNER_ENABLED),
  };

  readonly email = {
    provider: str(process.env.EMAIL_PROVIDER, "mock"),
    fromEmail: str(process.env.FROM_EMAIL, "leads@goldwaycapital.com"),
    fromName: str(process.env.FROM_NAME, "Goldway Capital"),
    sharedMailbox: str(process.env.M365_SHARED_MAILBOX, "leads@goldwaycapital.com"),
  };

  readonly compliance = {
    reviewRequired: bool(process.env.COMPLIANCE_REVIEW_REQUIRED, true),
    blockHealthFields: bool(process.env.BLOCK_HEALTH_INFO_FIELDS, true),
  };

  /** GHL should make real API calls only when fully configured and not mocked. */
  ghlLive(): boolean {
    return this.ghl.enabled && !this.ghl.mockMode && !!this.ghl.token && !!this.ghl.locationId;
  }
  socialLive(): boolean {
    return this.social.enabled && !this.social.mockMode;
  }
}
