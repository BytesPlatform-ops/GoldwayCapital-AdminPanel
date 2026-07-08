# Goldway Capital — Senior Solutions Platform

A monorepo delivering the full Goldway Capital system:

- **`apps/web`** — Next.js 14 (App Router, TS, Tailwind): the **public website** *and* the **admin panel**
- **`apps/api`** — NestJS 10 (TS): REST API, RBAC, GoHighLevel integration, compliance engine
- **PostgreSQL** + **Prisma** (migrations + seed)

The original proposal referenced WordPress; per the current direction, WordPress CMS is **replaced by a custom content module** — the admin composes articles and the Next.js **Resource Center** renders published ones directly.

> **Health-data boundary (hard rule):** no medical, prescription, health, coverage, or
> enrollment data is ever stored — in a lead, note, call log, submission, or CRM sync.
> It is enforced at the API boundary (field denylist + DTO whitelist) and verified by tests.

---

## Architecture

```
Browser ──► Next.js (apps/web :3000)
              • public site + 5 lead forms
              • admin panel (SSR, forwards session cookie)
              • /api/lead  proxy (adds secret ingest key)
                                 │  REST (JSON, cookie/JWT)
                                 ▼
            NestJS (apps/api :4000)
              Auth · Leads · Forms · Pipeline · Content · Social · Compliance
              · GHL · Email · Webhooks · Settings · Audit · IntegrationLogs
                                 │  Prisma
                                 ▼
            PostgreSQL (docker :5433)
```

GoHighLevel runs in **mock mode** by default (leads saved locally, IDs simulated, status
`SYNCED_MOCK`) and flips to live via env when credentials exist — nothing blocks on missing creds.

---

## Quick start

```bash
# 0. Prereqs: Node 20+
# 1. Install all workspaces
npm install

# 2. Database — pick ONE:
#    A) Supabase (default): edit apps/api/.env and paste your DB password into
#       [YOUR-PASSWORD] in BOTH DATABASE_URL and DIRECT_URL.
#    B) Local Docker (offline): `docker compose up -d`, then in apps/api/.env
#       comment the two Supabase lines and uncomment the two Docker lines.
#   apps/web/.env.local already points NEXT_PUBLIC_API_URL at :4000.

# 3. Create schema + seed
npm run db:setup                     # prisma generate + migrate + seed (in apps/api)

# 4. Run both apps
npm run dev                          # api :4000 + web :3000
#   or separately: npm run dev:api   /   npm run dev:web
```

Open **http://localhost:3000** (public site) and **http://localhost:3000/admin** (admin).

**Default logins** (seeded — change before real use). Password: `Goldway#2026`
`owner@` · `va@` · `editor@` · `compliance@` · `dev@` + `goldwaycapital.com`, roles OWNER / VA /
CONTENT_EDITOR / COMPLIANCE_REVIEWER / DEVELOPER_ADMIN.

## Commands (root)

| Command | Does |
|---|---|
| `docker compose up -d` | Start Postgres (host port 5433) |
| `npm run dev` | Run API + web together |
| `npm run dev:api` / `npm run dev:web` | Run one app |
| `npm run build` | Build API then web |
| `npm run db:setup` | generate + migrate + seed |
| `npm run db:migrate` | New migration (in apps/api) |
| `npm run db:seed` | Re-seed |

## Testing the lead flow

```bash
# via the public proxy (health field is stripped, value never stored)
curl -X POST http://localhost:3000/api/lead -H "Content-Type: application/json" \
  -d '{"source":"medicare","firstName":"Test","lastName":"Senior","email":"t@example.com","consentGiven":true,"medications":"metformin"}'
# → { ok:true, blockedFields:["medications"] }

# directly to the API (requires ingest key)
curl -X POST http://localhost:4000/forms/medicare -H "Content-Type: application/json" \
  -H "x-goldway-key: change-me-shared-with-website" -d '{"firstName":"A","lastName":"B","phone":"555","consentGiven":true}'
```

`source`/path ∈ `medicare` `final-expense` `reverse-mortgage` `probate` `recruiting`.

## Production notes

1. Managed Postgres → set `DATABASE_URL`, run `npm run db:migrate` (uses `prisma migrate deploy`) + `npm run db:seed`.
2. Real secrets: `JWT_SECRET`, `SESSION_SECRET`, `LEAD_API_INGEST_KEY` (shared web↔api), `CORS_ORIGINS`.
3. Flip GHL live: `GHL_ENABLED=true`, `GHL_MOCK_MODE=false`, token + location + pipeline + stage IDs. See `docs/GHL_INTEGRATION.md`.
4. Deploy `apps/api` (Node host) and `apps/web` (Vercel/Node). Point `NEXT_PUBLIC_API_URL`/`API_URL` at the API origin.
5. Change all seeded passwords; remove sample leads.
6. Move the in-request GHL sync / email send to a queue for scale (isolated in `FormsService.intake`).

See `docs/` for GHL, forms/content, social, and the QA checklist.
