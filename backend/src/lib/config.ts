
function bool(v: string | undefined, def = false): boolean {
  if (v === undefined) return def;
  return v === "true" || v === "1" || v === "yes";
}
function str(v: string | undefined, def = ""): string {
  return v ?? def;
}

/** Typed, centralized environment access. Nothing hardcoded elsewhere. */
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
    // Confirmation workflow to enroll a new contact into, keyed by LeadSource enum.
    workflowIds: {
      MEDICARE: str(process.env.GHL_WORKFLOW_MEDICARE_CONFIRMATION_ID),
      FINAL_EXPENSE: str(process.env.GHL_WORKFLOW_FINAL_EXPENSE_CONFIRMATION_ID),
      REVERSE_MTG: str(process.env.GHL_WORKFLOW_REVERSE_MTG_CONFIRMATION_ID),
      PROBATE: str(process.env.GHL_WORKFLOW_PROBATE_CONFIRMATION_ID),
      RECRUITING: str(process.env.GHL_WORKFLOW_RECRUITING_CONFIRMATION_ID),
    } as Record<string, string>,
    assignedUsers: {
      owner: str(process.env.GHL_ASSIGNED_USER_OWNER_ID),
      va: str(process.env.GHL_ASSIGNED_USER_VA_ID),
    },
  };

  readonly social = {
    enabled: bool(process.env.SOCIAL_PUBLISHING_ENABLED),
    mockMode: bool(process.env.SOCIAL_MOCK_MODE, true),
    ghlPlanner: bool(process.env.GHL_SOCIAL_PLANNER_ENABLED),
    // GHL Social Planner connected-account ids, keyed by SocialPlatform enum.
    // Falls back to the older direct-API env names when the GHL-prefixed one is unset.
    accountIds: {
      FACEBOOK: str(process.env.GHL_SOCIAL_FACEBOOK_ACCOUNT_ID) || str(process.env.FACEBOOK_PAGE_ID),
      INSTAGRAM: str(process.env.GHL_SOCIAL_INSTAGRAM_ACCOUNT_ID) || str(process.env.INSTAGRAM_ACCOUNT_ID),
      LINKEDIN: str(process.env.GHL_SOCIAL_LINKEDIN_ACCOUNT_ID) || str(process.env.LINKEDIN_ORGANIZATION_ID),
    } as Record<string, string>,
    googleBusinessProfileId: str(process.env.GHL_SOCIAL_GOOGLE_BUSINESS_PROFILE_ID),
  };

  readonly wordpress = {
    enabled: bool(process.env.WORDPRESS_ENABLED),
    mockMode: bool(process.env.WORDPRESS_MOCK_MODE, true),
    baseUrl: str(process.env.WORDPRESS_BASE_URL).replace(/\/+$/, ""),
    username: str(process.env.WORDPRESS_USERNAME),
    appPassword: str(process.env.WORDPRESS_APPLICATION_PASSWORD),
    authorId: str(process.env.WORDPRESS_DEFAULT_AUTHOR_ID),
    categoryId: str(process.env.WORDPRESS_RESOURCE_CATEGORY_ID),
    statusDefault: str(process.env.WORDPRESS_STATUS_DEFAULT, "draft"),
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
    // Live social publishing rides on the GHL Social Planner, so it needs the GHL
    // token + location too. Missing those keeps us safely in mock mode.
    return this.social.enabled && !this.social.mockMode && !!this.ghl.token && !!this.ghl.locationId;
  }
  wordpressLive(): boolean {
    return (
      this.wordpress.enabled &&
      !this.wordpress.mockMode &&
      !!this.wordpress.baseUrl &&
      !!this.wordpress.username &&
      !!this.wordpress.appPassword
    );
  }
}

/** Process-wide singleton. */
export const config = new AppConfigService();
