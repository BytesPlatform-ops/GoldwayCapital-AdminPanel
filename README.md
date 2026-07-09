# Goldway Capital

Two independently-deployable apps. **The repo root has no code, no `package.json`,
and no `.env`** — each app is fully self-contained.

```
frontend/   Public marketing website (Next.js, UI only) — deploy to Vercel
backend/    Admin panel + API + integrations + database (Next.js + Prisma) — deploy to any Node host
docs/       Project docs
```

## How they connect
The frontend never talks to the database or CRM directly. It calls the backend
**server-side only**:
- reads published articles / disclosures via `BACKEND_API_URL`
- forwards lead form posts through its own `/api/lead` proxy, which adds the
  shared `LEAD_API_INGEST_KEY` and calls `POST {backend}/api/forms/{source}`

Because all cross-app calls are server-to-server, there is **no CORS setup and no
cross-origin cookie handling**. The authenticated admin panel lives inside
`backend/`, so admin ↔ API is same-origin.

## Local development
```bash
# terminal 1 — backend on :3001
cd backend && npm install && cp config/env.example .env && npm run dev

# terminal 2 — frontend on :3000
cd frontend && npm install && cp .env.example .env.local && npm run dev
```
Set `frontend` `BACKEND_API_URL=http://localhost:3001` and use the **same**
`LEAD_API_INGEST_KEY` in both.

## Deploy (separately)
| App | Command | Notes |
|-----|---------|-------|
| backend  | `npm install && npm run build && npm run start` | needs `DATABASE_URL`, `JWT_SECRET`, integration creds |
| frontend | `npm install && npm run build && npm run start` | needs `BACKEND_API_URL`, `LEAD_API_INGEST_KEY` |

See each app's `README.md` for details.
