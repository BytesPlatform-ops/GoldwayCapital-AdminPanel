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
- ☐ Real `JWT_SECRET` / `LEAD_API_INGEST_KEY` set (key shared web↔api)
- ☐ `FRONTEND_ORIGIN` + `WORDPRESS_ORIGIN` restricted to the real origins; HTTPS; cookies `secure` (automatic in prod)
- ☐ `GHL_WEBHOOK_SECRET` set in prod (webhook fails closed without it)
- ☐ Turnstile/reCAPTCHA verified server-side (not implemented; keys removed from backend env — re-add if wired)

## GHL integration (this pass)
- ✅ `npm run typecheck` clean · `npm run build` succeeds (all routes + middleware)
- ✅ Per-form fields mapped to real GHL custom-field keys (`src/lib/lead-forms.ts`)
- ✅ Hidden + consent fields (leadSource, campaign, landingPageUrl, submissionDateTime,
  emailConsent, smsConsent, tcpaConsentTimestamp) built on intake and stored on the submission
- ✅ Submit response returns `ghlContactId` / `ghlOpportunityId` / `calendarLink`; no token/internals
- ✅ Env audited/cleaned (see `docs/ENV_AUDIT.md`); startup fails fast if GHL flipped live without required keys
- ☐ **Live cutover** (operator): set `GHL_ENABLED=true` + `GHL_MOCK_MODE=false`, run
  `backend/scripts/test-leads.sh`, then for each vertical confirm in GHL: contact created,
  lowercase tag applied, custom fields filled, opportunity in the correct pipeline **New** stage,
  confirmation workflow fired, calendar link correct
- ☐ Stage change from admin updates the GHL opportunity; failure surfaces `syncError` + retries
- ☐ `POST /api/webhooks/ghl` with valid signature/secret updates the mirror; invalid → 401; duplicate event id → deduped
