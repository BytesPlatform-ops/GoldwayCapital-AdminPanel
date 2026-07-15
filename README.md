# Goldway Capital — Admin Panel

Two independently-deployable apps. **The repo root has no code, no `package.json`,
and no `.env`** — each app is fully self-contained. The public website is
**WordPress** (goldwaycapital.com) and does not live in this repo.

```
frontend/   Admin panel UI (Next.js) — admin.goldwaycapital.com
backend/    API only: auth, admin APIs, lead intake, GHL, Prisma DB, webhooks — api.goldwaycapital.com
docs/       Project docs
```

## Final architecture
| Piece | Role |
|---|---|
| goldwaycapital.com (WordPress) | Public website, marketing pages, public lead forms |
| admin.goldwaycapital.com (`frontend/`) | Admin login, dashboard, leads, pipeline, tasks, settings |
| api.goldwaycapital.com (`backend/`) | Auth, admin APIs, WordPress lead submit API, GHL integration, DB, webhooks |
| GHL | CRM engine: contacts, opportunities, tags, pipelines, workflows, calendars |
| PostgreSQL (Prisma, backend only) | Admin users, lead mirror, submissions, notes, tasks, logs, sync records |

## How they connect
- The frontend holds **no secrets, no Prisma, no GHL code**. Every data call goes
  to the backend via `NEXT_PUBLIC_API_URL` (one client: `frontend/src/lib/api.ts`).
- Login: frontend posts to `POST {api}/api/auth/login`, stores the returned JWT in
  an httpOnly cookie, and checks sessions via `GET {api}/api/auth/me`.
- WordPress forms post to `POST {api}/api/public/leads/submit` with a `formType`
  (`medicare | final-expense | reverse-mortgage | probate | recruiting`) and get
  back the vertical's calendar booking link.
- Backend routes: `/api/auth/*` (public), `/api/public/leads/submit` (public),
  `/api/webhooks/ghl` (public), `/api/admin/*` (session-protected).
- CORS: the backend allows only `FRONTEND_ORIGIN` and `WORDPRESS_ORIGIN` — no wildcard.

## Local development
```bash
# terminal 1 — backend API on :3001
cd backend && npm install && cp .env.example .env && npm run db:setup && npm run dev

# terminal 2 — admin frontend on :3000
cd frontend && npm install && cp .env.example .env.local && npm run dev
# set NEXT_PUBLIC_API_URL=http://localhost:3001 in frontend/.env.local
```

Open http://localhost:3000/admin/login (seed login: `owner@goldwaycapital.com` / `Goldway#2026` — change it).

## Deploy (separately)
| App | Domain | Command | Notes |
|-----|--------|---------|-------|
| frontend | admin.goldwaycapital.com | `npm run build` | Netlify/Vercel; env: `NEXT_PUBLIC_API_URL` |
| backend | api.goldwaycapital.com | `npm run build && npm run start` | Render/Railway/VPS; env: see `backend/.env.example` |

See each app's `README.md` for details.
