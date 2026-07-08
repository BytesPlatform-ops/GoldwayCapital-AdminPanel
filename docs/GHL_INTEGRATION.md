# GoHighLevel (GHL) Integration — NestJS

GHL is the CRM source of truth once connected, with a local mirror so the admin is always
usable. **Until credentials exist, everything runs in mock mode** (leads saved locally, IDs
simulated, sync status `SYNCED_MOCK`).

## Where it lives

```
apps/api/src/ghl/
  ghl.types.ts          GhlAdapter interface (the port)
  ghl-mock.adapter.ts   deterministic fake IDs, no network (default)
  ghl-live.adapter.ts   GoHighLevel API v2 (LeadConnector) — all request shapes isolated here
  ghl.service.ts        adapter() factory + syncLead / syncStage / retryFailed (+ retry + logging + mirror writeback)
  ghl.controller.ts     GET /ghl/status · POST /ghl/sync-lead/:id · POST /ghl/retry-failed
```

`GhlService.adapter()` returns the **live** client only when `AppConfigService.ghlLive()` is true:
`GHL_ENABLED=true` **and** `GHL_MOCK_MODE=false` **and** token **and** location id present. Otherwise
the mock. Missing creds never throw and never block lead capture.

## Capabilities

| Capability | Method | Endpoint (live) |
|---|---|---|
| Upsert contact | `upsertContact` | `POST /contacts/upsert` |
| Apply source tag | `applyTags` | `POST /contacts/:id/tags` |
| Upsert opportunity | `upsertOpportunity` | `POST /opportunities/` |
| Move stage | `moveOpportunityStage` | `PUT /opportunities/:id` |
| Create task | `createTask` | `POST /contacts/:id/tasks` |
| Create note | `createNote` | `POST /contacts/:id/notes` |
| Receive webhooks | — | `POST /webhooks/ghl` (signature-verified) |
| Retry failed | `retryFailed` | `POST /ghl/retry-failed` |

Failed syncs set `ghlSyncStatus = FAILED`; retried on the next stage change or via **Re-sync to GHL**
on the lead detail page. Every call is written to `IntegrationLog` (admin → Integration Logs).

## Tags & stages

Tags: `Medicare` · `Final-Expense` · `Reverse-Mtg` · `Probate` · `Recruiting`.
Pipeline stages map `NEW → CONTACTED → APPOINTMENT_SET → CLOSED` to the four `GHL_STAGE_*_ID` env values.

## Go live

```bash
GHL_ENABLED=true
GHL_MOCK_MODE=false
GHL_PRIVATE_INTEGRATION_TOKEN=...
GHL_LOCATION_ID=...
GHL_PIPELINE_ID=...
GHL_STAGE_NEW_ID=...  GHL_STAGE_CONTACTED_ID=...  GHL_STAGE_APPOINTMENT_SET_ID=...  GHL_STAGE_CLOSED_ID=...
GHL_WEBHOOK_SECRET=...   # optional; verifies inbound webhooks
```

Client must provide: a GHL sub-account (Location), a Private Integration Token (contacts +
opportunities scopes), the Location ID, a 4-stage Pipeline + its Stage IDs, and optionally a webhook
to `{API_URL}/webhooks/ghl`.

> GHL field shapes vary slightly by account/version — adjust only `ghl-live.adapter.ts`. The
> `GhlAdapter` contract and everything above it stay unchanged. Only contact + scheduling data is
> ever sent; SOA is status-only.
