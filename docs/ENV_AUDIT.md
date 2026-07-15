# Backend env audit

Audit of `backend/.env` usage. Every key was checked against `process.env`
references across `backend/src`. Real secrets live only in the gitignored
`.env`; `backend/.env.example` carries placeholders.

## Keys kept (required / referenced)
- **App**: `APP_URL`, `NEXT_PUBLIC_APP_URL`
- **CORS**: `FRONTEND_ORIGIN`, `WORDPRESS_ORIGIN` — read by `src/middleware.ts`
- **Database**: `DATABASE_URL`, `DIRECT_URL` — Prisma
- **Auth**: `JWT_SECRET`, `LEAD_API_INGEST_KEY`
- **GHL core**: `GHL_ENABLED`, `GHL_MOCK_MODE`, `GHL_API_BASE_URL`,
  `GHL_PRIVATE_INTEGRATION_TOKEN`, `GHL_LOCATION_ID`, `GHL_WEBHOOK_SECRET`
- **GHL pipelines/stages**: `GHL_PIPELINE_<SOURCE>_ID`,
  `GHL_STAGE_<SOURCE>_<STAGE>_ID` (+ legacy single-pipeline fallback)
- **GHL custom fields**: `GHL_CF_<NAME>_ID` / `GHL_CF_<NAME>_KEY` (common,
  Medicare, Final Expense, Reverse Mortgage, Probate, Recruiting)
- **GHL tags**: `GHL_TAG_MEDICARE|FINAL_EXPENSE|REVERSE_MTG|PROBATE|RECRUITING`
- **GHL calendars**: `GHL_CALENDAR_*_ID` / `_SLUG`, `*_CALENDAR_LINK`
- **GHL workflows/users**: `GHL_WORKFLOW_*_CONFIRMATION_ID`, `GHL_ASSIGNED_USER_*_ID`
- **Social**: `SOCIAL_PUBLISHING_ENABLED`, `SOCIAL_MOCK_MODE`,
  `GHL_SOCIAL_PLANNER_ENABLED`, `GHL_SOCIAL_*_ACCOUNT_ID`,
  `GHL_SOCIAL_GOOGLE_BUSINESS_PROFILE_ID`, `FACEBOOK_PAGE_ID`,
  `INSTAGRAM_ACCOUNT_ID`, `LINKEDIN_ORGANIZATION_ID` (fallbacks)
- **WordPress**: `WORDPRESS_ENABLED`, `WORDPRESS_MOCK_MODE`, `WORDPRESS_BASE_URL`,
  `WORDPRESS_USERNAME`, `WORDPRESS_APPLICATION_PASSWORD`,
  `WORDPRESS_DEFAULT_AUTHOR_ID`, `WORDPRESS_RESOURCE_CATEGORY_ID`,
  `WORDPRESS_STATUS_DEFAULT`
- **Email**: `EMAIL_PROVIDER`, `FROM_EMAIL`, `FROM_NAME`, `M365_SHARED_MAILBOX`
- **Compliance**: `COMPLIANCE_REVIEW_REQUIRED`, `BLOCK_HEALTH_INFO_FIELDS`

## Keys removed (blank + unreferenced + not required)
| Key(s) | Reason |
|---|---|
| `ADMIN_URL`, `API_URL`, `NEXT_PUBLIC_API_URL` | Frontend/public URLs; not read by the backend. |
| `CORS_ORIGINS` | Superseded — CORS reads `FRONTEND_ORIGIN` + `WORDPRESS_ORIGIN`. |
| `SESSION_SECRET` | Unreferenced. Auth uses `JWT_SECRET`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Blank + unused. Confirmation email is sent by GHL workflows; backend email defaults to mock. |
| `M365_TENANT_ID`, `M365_CLIENT_ID`, `M365_CLIENT_SECRET` | Blank + unused. Only `M365_SHARED_MAILBOX` is read. |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `GOOGLE_SEARCH_CONSOLE_VERIFICATION`, `GOOGLE_TAG_MANAGER_ID` | Analytics belongs to the public site/frontend; unused in backend. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | Blank + unused; spam protection not implemented. Re-add if/when verification is wired. |
| `API_PORT` | Unused. Next serves on `-p 3001`. |

## Added
- `FRONTEND_ORIGIN`, `WORDPRESS_ORIGIN` — the CORS middleware reads these; the
  old `.env` only had the unused `CORS_ORIGINS`, which would have broken
  production CORS.

## Kept but not wired to live behavior
- `GHL_MOCK_MODE=true` / `GHL_ENABLED=false` — GHL stays in mock mode until the
  operator flips it and runs the Integrations test. The token is present but not
  used for live calls in this state.
