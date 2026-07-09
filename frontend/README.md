# Goldway Capital — Frontend (Public Website)

Public marketing website. **UI only** — no secrets, no CRM/DB logic. It reads
published content and disclosures from the backend **server-side** and forwards
lead submissions to the backend through a server proxy (so the shared ingest key
never reaches the browser). Because every backend call is server-to-server there
is **no CORS and no cross-origin cookie handling**.

Built with Next.js (App Router) + Tailwind. Deploys standalone (e.g. Vercel).

## Run

```bash
npm install
cp .env.example .env.local     # set BACKEND_API_URL + LEAD_API_INGEST_KEY
npm run dev                    # http://localhost:3000  (backend must be on :3001)
```

Deploy: `npm run build` → `npm run start` (or Vercel).

## Requested structure → where it actually lives

Next.js dictates the `src/app` routing folder, so the conceptual layout you asked
for maps onto real files like this:

| Requested            | Actual location                                   | Purpose |
|----------------------|---------------------------------------------------|---------|
| `assets/css`         | `src/app/globals.css` + `tailwind.config.ts`      | styling |
| `assets/js`          | compiled from React components by Next            | scripts |
| `assets/images` / `videos` | `public/images`, `public/videos`            | static media |
| `components/header`, `footer` | `src/components/PublicChrome.tsx`        | site header + footer |
| `components/sections`| `src/components/ServicePageView.tsx`              | page sections |
| `components/forms`   | `src/components/LeadForm.tsx`                      | lead form UI |
| `components/carousel`| add under `src/components/` when built            | carousels/video |
| `pages/*`            | `src/app/*/page.tsx` (home, contact, service pages, resource-center) | routes |
| `theme/templates` / `parts` | `src/app/layout.tsx` (root chrome)         | page shell |

## Pages
`/` (home) · `/medicare-solutions` · `/reverse-mortgage-solutions` ·
`/senior-real-estate-probate-solutions` · `/medicare-agent-opportunities` ·
`/resource-center` (+ `/resource-center/[slug]`) · `/contact` · `/privacy-policy` · `/terms`

## Talking to the backend
- `src/lib/api.ts` → `backendGet()` reads `BACKEND_API_URL` (server-side).
- `src/app/api/lead/route.ts` → proxies form posts to `POST {backend}/api/forms/{source}`
  with the `x-goldway-key` ingest header.

No health/medical/coverage data is ever collected or forwarded.
