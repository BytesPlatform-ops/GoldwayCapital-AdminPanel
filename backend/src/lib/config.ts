
function bool(v: string | undefined, def = false): boolean {
  if (v === undefined) return def;
  return v === "true" || v === "1" || v === "yes";
}
function str(v: string | undefined, def = ""): string {
  return v ?? def;
}

// Lead verticals and pipeline stages — mirror the LeadSource / PipelineStage enums.
const GHL_SOURCES = ["MEDICARE", "FINAL_EXPENSE", "REVERSE_MTG", "PROBATE", "RECRUITING"] as const;
const GHL_STAGES = ["NEW", "CONTACTED", "APPOINTMENT_SET", "CLOSED"] as const;

// GHL tags are lowercase by convention; GHL_TAG_<SOURCE> env vars override.
const DEFAULT_GHL_TAGS: Record<string, string> = {
  MEDICARE: "medicare",
  FINAL_EXPENSE: "final-expense",
  REVERSE_MTG: "reverse-mtg",
  PROBATE: "probate",
  RECRUITING: "recruiting",
};

const CALENDAR_LINK_ENV: Record<string, string> = {
  MEDICARE: "MEDICARE_CALENDAR_LINK",
  FINAL_EXPENSE: "FINAL_EXPENSE_CALENDAR_LINK",
  REVERSE_MTG: "REVERSE_MORTGAGE_CALENDAR_LINK",
  PROBATE: "PROBATE_CALENDAR_LINK",
  RECRUITING: "RECRUITING_CALENDAR_LINK",
};

export interface GhlPipelineConfig {
  pipelineId: string;
  stageIds: Record<string, string>;
}

/** Typed, centralized environment access. Nothing hardcoded elsewhere. */
export class AppConfigService {
  readonly jwtSecret = str(process.env.JWT_SECRET, "dev-insecure-jwt-secret-change-me-please-32bytes");
  readonly cookieSecret = str(process.env.COOKIE_SECRET);
  readonly leadApiIngestKey = str(process.env.LEAD_API_INGEST_KEY);

  // Browser origins allowed by the CORS middleware (see src/middleware.ts).
  readonly frontendOrigin = str(process.env.FRONTEND_ORIGIN, "http://localhost:3000");
  readonly wordpressOrigin = str(process.env.WORDPRESS_ORIGIN, "https://goldwaycapital.com");

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
    // Per-vertical pipelines: GHL_PIPELINE_<SOURCE>_ID + GHL_STAGE_<SOURCE>_<STAGE>_ID.
    // Each falls back to the legacy single-pipeline vars above when unset.
    pipelines: Object.fromEntries(
      GHL_SOURCES.map((s) => [
        s,
        {
          pipelineId: str(process.env[`GHL_PIPELINE_${s}_ID`]) || str(process.env.GHL_PIPELINE_ID),
          stageIds: Object.fromEntries(
            GHL_STAGES.map((st) => [st, str(process.env[`GHL_STAGE_${s}_${st}_ID`]) || str(process.env[`GHL_STAGE_${st}_ID`])])
          ),
        },
      ])
    ) as Record<string, GhlPipelineConfig>,
    // Contact tags applied per vertical (lowercase). GHL_TAG_<SOURCE> overrides.
    tags: Object.fromEntries(GHL_SOURCES.map((s) => [s, str(process.env[`GHL_TAG_${s}`], DEFAULT_GHL_TAGS[s])])) as Record<string, string>,
    // GHL custom-field ids: GHL_CF_<NAME>_ID holds the field id; the optional
    // GHL_CF_<NAME>_KEY holds our payload key (defaults to lowercased <NAME>).
    customFieldIds: (() => {
      const map: Record<string, string> = {};
      for (const [name, value] of Object.entries(process.env)) {
        const m = name.match(/^GHL_CF_(.+)_ID$/);
        if (!m || !value) continue;
        const key = str(process.env[`GHL_CF_${m[1]}_KEY`]) || m[1].toLowerCase();
        map[key] = value;
      }
      return map;
    })(),
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

  // Booking link returned to the WordPress site after a successful lead submit.
  readonly calendarLinks = Object.fromEntries(
    GHL_SOURCES.map((s) => [s, str(process.env[CALENDAR_LINK_ENV[s]])])
  ) as Record<string, string>;

  /** Pipeline + stage ids for a lead source, with the legacy single-pipeline fallback. */
  ghlPipelineFor(source: string): GhlPipelineConfig {
    return this.ghl.pipelines[source] ?? { pipelineId: this.ghl.pipelineId, stageIds: this.ghl.stageIds };
  }

  /**
   * Env var NAMES that must be present before GHL can safely go live, grouped.
   * Custom fields validated here are only the common/hidden ones applied to every
   * lead; per-vertical field ids are reported (not hard-required).
   */
  private requiredGhlEnvNames(): string[] {
    const names: string[] = ["GHL_PRIVATE_INTEGRATION_TOKEN", "GHL_LOCATION_ID"];
    for (const s of GHL_SOURCES) {
      names.push(`GHL_TAG_${s}`);
      names.push(`GHL_PIPELINE_${s}_ID`);
      for (const st of GHL_STAGES) names.push(`GHL_STAGE_${s}_${st}_ID`);
      names.push(CALENDAR_LINK_ENV[s]);
    }
    names.push(
      "GHL_CF_LEAD_SOURCE_ID", "GHL_CF_CAMPAIGN_ID", "GHL_CF_LANDING_PAGE_URL_ID",
      "GHL_CF_SUBMISSION_DATE_TIME_ID", "GHL_CF_EMAIL_CONSENT_ID",
      "GHL_CF_SMS_CONSENT_ID", "GHL_CF_TCPA_CONSENT_TIMESTAMP_ID"
    );
    return names;
  }

  /** Required GHL env var names that are currently missing/blank. */
  missingGhlEnv(): string[] {
    return this.requiredGhlEnvNames().filter((n) => !str(process.env[n]));
  }

  /** Presence-only config report (booleans, never values) — safe to log. */
  ghlConfigReport(): Record<string, boolean> {
    return {
      enabled: this.ghl.enabled,
      mockMode: this.ghl.mockMode,
      tokenPresent: !!this.ghl.token,
      locationPresent: !!this.ghl.locationId,
      allPipelinesPresent: Object.values(this.ghl.pipelines).every((p) => !!p.pipelineId),
      allStagesPresent: Object.values(this.ghl.pipelines).every((p) => Object.values(p.stageIds).every(Boolean)),
      allCalendarLinksPresent: Object.values(this.calendarLinks).every(Boolean),
    };
  }

  /**
   * Fail fast on startup: when the operator flips GHL live (GHL_ENABLED=true)
   * outside tests, missing required env aborts boot with a clear, value-free
   * message. Mock/disabled mode never throws.
   */
  assertGhlConfigured(): void {
    if (process.env.NODE_ENV === "test" || !this.ghl.enabled) return;
    const missing = this.missingGhlEnv();
    if (missing.length) throw new Error(`Missing required GHL env: ${missing.join(", ")}`);
  }

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
