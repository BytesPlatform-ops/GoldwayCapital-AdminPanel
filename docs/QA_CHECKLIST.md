# QA / Pre-Launch Checklist (NestJS + Next.js)

✅ = verified during this build · ☐ = to test manually

## Lead forms
- ✅ Medicare form strips health fields (`medications/medicalConditions/medicareCardNumber`); values never stored (verified in DB + unit intent)
- ✅ Proxy keeps the ingest key server-side; direct `/forms/*` requires `x-goldway-key`
- ✅ Reverse-mortgage submission via public proxy creates a lead, health field stripped
- ☐ Final Expense / Probate / Recruiting each create a lead with the right `leadSource`
- ✅ Medicare lead auto-sets `soaRequired=true`, `soaStatus=REQUIRED`
- ☐ Honeypot (`website` filled) → silently dropped
- ☐ Missing email **and** phone → 400
- ☐ Medicare form shows the health warning; recruiting routes to Recruiting section

## Admin (Next.js ↔ NestJS)
- ✅ `/admin/dashboard` unauthenticated → 307 redirect to `/admin/login`
- ✅ Login bridges the NestJS JWT into a first-party cookie; dashboard renders live counts
- ✅ RBAC: VA → 403 on `/settings`; Owner → 200
- ✅ Lead inbox renders seeded + new leads (SSR forwards cookie to API)
- ✅ Pipeline board renders four columns
- ☐ Stage change (detail + board) persists and attempts GHL sync; audit row written
- ☐ Add note / call log shows the health warning; risky text gets the amber compliance flag
- ☐ Follow-up task complete; recruiting status change; SOA control (Medicare only)

## Integrations
- ✅ GHL mock mode: `syncLead:mock`, contact `mock_contact_*`, status `SYNCED_MOCK`
- ✅ Missing GHL creds do not crash anything
- ☐ Simulate live GHL failure (bad token, `GHL_MOCK_MODE=false`) → lead saved, `FAILED`, logged; **Re-sync** retries
- ☐ Social publish records per-platform status; failed platform → Retry works; others unaffected
- ☐ `POST /webhooks/ghl` with valid signature updates mirror; invalid → 401

## Compliance
- ✅ `/compliance/check-content` flags "government approved", "we provide forward mortgages", etc.
- ☐ Medicare-sensitive content flagged; cannot approve/publish with a block-severity phrase
- ☐ `COMPLIANCE_REVIEW_REQUIRED=true` forces DRAFT → NEEDS_REVIEW → APPROVED before publish
- ✅ Disclosure blocks seeded for Medicare / Reverse Mortgage / Probate; shown on service pages
- ☐ Audit log records login, lead.created, stage_changed, note.added, content.published, sync failures

## Security / hardening (before prod)
- ☐ Seeded passwords changed; sample leads removed
- ☐ Real `JWT_SECRET` / `SESSION_SECRET` / `LEAD_API_INGEST_KEY` set (key shared web↔api)
- ☐ `CORS_ORIGINS` restricted to the real web origin; HTTPS; cookies `secure` (automatic in prod)
- ☐ Turnstile/reCAPTCHA verified server-side (currently accepted; wire verification before launch)
