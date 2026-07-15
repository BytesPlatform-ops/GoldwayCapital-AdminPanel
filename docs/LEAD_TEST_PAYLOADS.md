# Lead submit — test payloads

Manual tests for `POST /api/public/leads/submit` (backend on `http://localhost:3001`).
Send JSON with `Content-Type: application/json`. If `LEAD_API_INGEST_KEY` is set,
add header `x-goldway-key: <that value>`.

The endpoint is safe to hit with `GHL_MOCK_MODE=true`: a local Lead is created and
GHL calls are mocked (no real CRM contact). Flip GHL live only when ready.

Response shape:
```json
{ "ok": true, "leadId": "...", "ghlContactId": "...", "ghlOpportunityId": "...",
  "ghlSyncStatus": "SYNCED_MOCK", "blockedFields": [], "calendarLink": "https://..." }
```

## Field-name contract
Each form sends `formType` plus these keys (camelCase). Consent values accept
`Yes/No/true/false/on` and normalize to `Yes`/`No`. Checkbox groups may be arrays.
Hidden fields (`leadSource`, `campaign`, `landingPageUrl`, `submissionDateTime`,
`tcpaConsentTimestamp`, `emailConsent`, `smsConsent`) should be sent by the site;
`submissionDateTime`/`tcpaConsentTimestamp` are filled server-side if omitted.

> Compliance: never send medical conditions, plan names, coverage details, or
> enrollment specifics. Health-named fields are stripped at the boundary; only the
> whitelisted keys below reach GHL.

## Medicare — `formType: medicare`
```json
{
  "formType": "medicare",
  "firstName": "Test", "lastName": "Medicare",
  "phone": "555-201-0001", "email": "test.medicare@example.com", "zipCode": "85001",
  "county": "Maricopa", "turning65": "Yes",
  "currentlyEnrolledMedicare": "No", "bestTimeToCall": "Morning",
  "medicareHelpWith": ["Understanding options", "Comparing plans"],
  "medicareBiggestQuestion": "Which plan type fits me?",
  "campaign": "google-medicare", "landingPageUrl": "https://goldwaycapital.com/medicare",
  "emailConsent": "Yes", "smsConsent": "Yes"
}
```

## Final Expense — `formType: final-expense`
```json
{
  "formType": "final-expense",
  "firstName": "Test", "lastName": "FinalExpense",
  "phone": "555-201-0002", "email": "test.fe@example.com", "zipCode": "75001",
  "ageRange": "60-69", "finalExpenseCoverage": "No", "bestTimeToCall": "Afternoon",
  "finalExpenseMostImportant": "Covering funeral costs",
  "campaign": "fb-final-expense", "landingPageUrl": "https://goldwaycapital.com/final-expense",
  "emailConsent": "Yes", "smsConsent": "No"
}
```

## Reverse Mortgage — `formType: reverse-mtg`
```json
{
  "formType": "reverse-mtg",
  "firstName": "Test", "lastName": "Reverse",
  "phone": "555-201-0003", "email": "test.reverse@example.com", "zipCode": "90001",
  "age62OrOlder": "Yes", "primaryResidence": "Yes",
  "estimatedHomeValue": "$500k-$750k", "estimatedMortgageBalance": "$100k-$200k",
  "reverseMortgageMainGoal": "Supplement retirement income", "bestTimeToCall": "Evening",
  "reverseMortgageBiggestConcern": "Keeping the home in the family",
  "campaign": "google-reverse", "landingPageUrl": "https://goldwaycapital.com/reverse-mortgage",
  "emailConsent": "Yes", "smsConsent": "Yes"
}
```

## Probate / Senior Real Estate — `formType: probate`
```json
{
  "formType": "probate",
  "firstName": "Test", "lastName": "Probate",
  "phone": "555-201-0004", "email": "test.probate@example.com",
  "state": "CA", "realEstateSituation": "Inherited property",
  "executorOrHeir": "Executor", "realEstateTimeline": "3-6 months", "bestTimeToCall": "Morning",
  "realEstateDetails": "Single-family home, needs light repairs",
  "campaign": "referral", "landingPageUrl": "https://goldwaycapital.com/probate",
  "emailConsent": "Yes", "smsConsent": "No"
}
```

## Recruiting — `formType: recruiting`
```json
{
  "formType": "recruiting",
  "firstName": "Test", "lastName": "Recruit",
  "phone": "555-201-0005", "email": "test.recruit@example.com",
  "stateOfResidence": "FL", "insuranceLicense": "Yes",
  "licensedLines": ["Health", "Life"], "ahipCertified": "Yes",
  "recruitingBackground": "3 years selling Medicare Advantage",
  "campaign": "linkedin-recruiting", "landingPageUrl": "https://goldwaycapital.com/careers",
  "emailConsent": "Yes", "smsConsent": "Yes"
}
```

## Run all five
```bash
# From backend/: server must be running (npm run dev) and DB reachable.
LEAD_API_INGEST_KEY=<your-key> bash scripts/test-leads.sh
```

## What to verify (per lead)
1. `201` response with `leadId` + `ghlContactId` (mock ids in mock mode).
2. Admin panel shows the lead (`GET /api/admin/leads`).
3. Live mode only: contact appears in GHL with the lowercase tag, custom fields
   filled, and an opportunity in the correct pipeline **New** stage; the vertical
   confirmation workflow fires (email/SMS/task).
4. `calendarLink` returned matches the vertical booking link.
