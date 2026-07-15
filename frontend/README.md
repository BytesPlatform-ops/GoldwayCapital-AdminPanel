# Goldway Capital — Admin Panel Frontend

Admin UI only (Next.js App Router + Tailwind), deployed as
**admin.goldwaycapital.com**. The public website is WordPress and is not part of
this app.

**This app has no database, no Prisma, no GHL code, and no secrets.** Every data
call goes to the backend API (api.goldwaycapital.com) through the single client
in `src/lib/api.ts`, using the `NEXT_PUBLIC_API_URL` env var.

## Routes
```
/admin/login        sign in (calls POST {api}/api/auth/login)
/admin/dashboard    stats + recent submissions
/admin/leads        lead inbox · /admin/leads/[id] detail
/admin/pipeline     kanban board (stage moves sync to GHL via the backend)
/admin/tasks        follow-up tasks
/admin/settings     settings + integration status
...plus appointments, recruiting, content, compliance, integrations, audit/integration logs
```

## Auth
`loginAction` (`src/lib/actions.ts`) posts credentials to the backend and stores
the returned JWT in an httpOnly cookie on this domain. Server components forward
that cookie to the backend on every request; session validity is always checked
by the backend (`GET /api/auth/me` via `src/lib/auth.ts`). Middleware redirects
cookie-less visitors to `/admin/login`.

## Run
```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL (local backend: http://localhost:3001)
npm run dev                  # http://localhost:3000/admin/login
```

Deploy: `npm run build` → `npm run start` (or Netlify/Vercel) with
`NEXT_PUBLIC_API_URL=https://api.goldwaycapital.com`.
