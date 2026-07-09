# Goldway Capital — Backend (Admin Panel + API + Integrations)

All server-side work: the admin panel UI, every API route, CRM/GHL + WordPress +
social + email integrations (mock/live), webhook handling, validation, and the
database. The admin UI is served by this same app, so admin ↔ API is **same
origin** — no cross-origin cookie problems.

Built with Next.js (App Router) + Prisma (Supabase/PostgreSQL). Deploys standalone
(Vercel, Render, Railway, any Node host).

## Run

```bash
npm install
cp config/env.example .env      # fill DATABASE_URL, JWT_SECRET, integration creds
npm run db:deploy               # apply migrations
npm run db:seed                 # seed admin users (first time)
npm run dev                     # http://localhost:3001  → /admin/login
```

Deploy: `npm run build` → `npm run start`.

## Requested structure → where it actually lives

Next.js requires API routes under `src/app/api`, so the conceptual backend tree
maps onto real files:

| Requested                  | Actual location |
|----------------------------|-----------------|
| `api/leads`, `api/forms`, `api/webhooks` | `src/app/api/leads`, `src/app/api/forms`, `src/app/api/webhooks` |
| `api/crm`                  | `src/app/api/ghl`, `src/app/api/integrations` |
| `integrations/gohighlevel` | `src/integrations/ghl` |
| `integrations/wordpress`   | `src/integrations/wordpress` |
| `integrations/email`       | `src/integrations/email` |
| `database/schema` + `migrations` | `prisma/schema.prisma`, `prisma/migrations` |
| `services/lead-routing`    | `src/server/leads.ts`, `src/server/forms.ts` |
| `services/notifications`   | `src/integrations/email`, `src/server/*` |
| `services/validation`      | `src/server/compliance.ts` (health-field blocking) + route input checks |
| `config/env.example`       | `config/env.example` |
| `logs/`                    | `logs/` |
| backend utility functions  | `src/lib` (config, auth/session, errors, http, logger) |

## Key API endpoints
Public (called by the frontend): `POST /api/forms/{medicare|final-expense|reverse-mortgage|probate|recruiting}`,
`GET /api/public/resource-center[/:slug]`, `GET /api/compliance/disclosures`, `POST /api/webhooks/ghl`.
Admin (session-guarded): leads, pipeline, dashboard, content, social, settings,
logs, users, tasks, appointments, and `GET /api/integrations/status` +
`POST /api/integrations/{wordpress,ghl,social}/test`.

## Integration modes
`GHL_MOCK_MODE`, `WORDPRESS_MOCK_MODE`, `SOCIAL_MOCK_MODE` default to `true`
(safe). Fill creds + flip the matching `*_ENABLED=true` / `*_MOCK_MODE=false` and
use the Test buttons on `/admin/integrations` to go live.

**Compliance:** no health, medical, prescription, coverage, or enrollment data is
stored — health-named fields are stripped at the boundary.
