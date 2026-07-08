# Social Publishing Integration

"Write once, publish everywhere." The Content Composer publishes an approved article to the
**WordPress Resource Center** and, in one action, to connected social platforms — recording a
**per-platform status** (`pending / scheduled / published / failed`) and any API error, with retry.

## Architecture

```
src/lib/integrations/social/index.ts   publishToSocial() — mock + live paths, per-call logging
src/lib/actions/content.ts             publishContent() — WP + fan-out to selected platforms
DB: SocialPost (one row per contentPost × platform) — status, externalId, error, scheduledAt
```

Gated by `socialLive()`: true only when `SOCIAL_PUBLISHING_ENABLED=true` and (currently) GHL
Social Planner is enabled and GHL is live. Otherwise a **mock** result is stored so the whole
publish flow — including per-platform status badges — is testable without credentials.

A failure on one platform is **captured, not thrown** — the other platforms still publish.

## Supported platforms

`wordpress` (Resource Center), `facebook`, `instagram`, `linkedin`. Additional platforms can be
added by extending `SOCIAL_PLATFORMS` in `src/lib/constants.ts`.

## Preferred approach: GHL Social Planner

Since Goldway uses GoHighLevel, the recommended path is the **GHL Social Planner**, so social
accounts are connected once inside GHL rather than managing per-network API apps.

```bash
SOCIAL_PUBLISHING_ENABLED=true
GHL_SOCIAL_PLANNER_ENABLED=true
FACEBOOK_PAGE_ID=...
INSTAGRAM_ACCOUNT_ID=...
LINKEDIN_ORGANIZATION_ID=...
```

The live Social Planner call is stubbed in `publishToSocial()` (it throws a clear "not yet
configured" error that is recorded as a `failed` status) until the account is connected and the
exact Social Planner endpoint/scopes are confirmed — this is the single place to wire it.

## What the client must provide to go live

- GHL Social Planner set up with **Facebook Page, Instagram, LinkedIn** connected, **or**
- Direct Meta/LinkedIn app credentials if not using Social Planner (more setup, per-network review).

Until then, social publishing runs in **mock mode**: content flows through the full
compose → review → approve → publish lifecycle and shows `mock`/`published` per platform.
