# Goldway Capital — Backend API

**API only** — no UI is served here. Deployed as **api.goldwaycapital.com**.
Auth/JWT, admin APIs, the WordPress public lead-submit API, GHL integration,
WordPress/social/email integrations (mock/live), webhooks, validation,
compliance boundary enforcement, and the Prisma/PostgreSQL database.

The admin panel UI lives in the separate `frontend/` app and calls this API
cross-origin; the CORS middleware (`src/middleware.ts`) allows only
`FRONTEND_ORIGIN` and `WORDPRESS_ORIGIN` (never a wildcard).

## Secrets & safety
All real secrets (DB URL, `JWT_SECRET`, the GHL private integration token, GHL
ids) live only in `.env`, which is gitignored and never committed. Only
`.env.example` (placeholders) is tracked. The GHL token stays server-side — it is
never returned in an API response, logged, or shared with the frontend/WordPress.
Config logging reports only whether a key is present, never its value.

## Run
```bash
npm install
cp .env.example .env            # fill DATABASE_URL, JWT_SECRET, integration creds
npm run db:deploy               # apply migrations
npm run db:seed                 # seed admin users (first time)
npm run dev                     # http://localhost:3001
```

Deploy: `npm run build` → `npm run start`.

## API surface
Public:
- `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/logout`
- `POST /api/public/leads/submit` — WordPress lead intake. Body carries
  `formType` (`medicare | final-expense | reverse-mortgage | probate | recruiting`)
  plus the lead fields; optional `x-goldway-key` shared-secret header
  (`LEAD_API_INGEST_KEY`). Returns `{ ok, leadId, calendarLink }`.
- `GET /api/public/resource-center[/:slug]`
- `POST /api/webhooks/ghl`

Admin (session-guarded, all under `/api/admin/*`):
- `GET /api/admin/dashboard/{summary,leads-by-source,recent-activity}`
- `GET /api/admin/leads` · `GET /api/admin/leads/:id` · `PATCH /api/admin/leads/:id/stage`
- `POST /api/admin/leads/:id/{notes,tasks,call-logs,appointments,email-logs}`
- `GET /api/admin/pipelines` · `PATCH /api/admin/pipelines/leads/:id/move`
- tasks, appointments, recruiting, content, compliance, social, settings, users,
  audit-logs, integration-logs, `GET /api/admin/integrations/status` + test routes,
  `POST /api/admin/ghl/{retry-failed,sync-lead/:id}`

## Layout
| Concern | Location |
|---|---|
| Route handlers | `src/app/api/{auth,public,admin,webhooks}` |
| Services (business logic) | `src/server/*` |
| GHL / WordPress / email / social | `src/integrations/*` |
| DB client + schema/migrations | `src/db/prisma.ts`, `prisma/` |
| Config, auth/session, errors, http | `src/lib/*` |

## GHL wiring
Per-vertical pipelines and stages come from `GHL_PIPELINE_<SOURCE>_ID` /
`GHL_STAGE_<SOURCE>_<STAGE>_ID` (legacy single-pipeline vars are the fallback).
Contacts get the lowercase vertical tag (`GHL_TAG_*`), custom fields map via
`GHL_CF_<NAME>_ID/_KEY`, and each vertical's booking link (`*_CALENDAR_LINK`) is
returned to WordPress on submit.

## Integration modes
`GHL_MOCK_MODE`, `WORDPRESS_MOCK_MODE`, `SOCIAL_MOCK_MODE` default to `true`
(safe). Fill creds + flip the matching `*_ENABLED=true` / `*_MOCK_MODE=false` and
use the Test buttons on the frontend's Integrations page to go live.

**Compliance:** no health, medical, prescription, coverage, or enrollment data is
stored — health-named fields are stripped at the boundary.
