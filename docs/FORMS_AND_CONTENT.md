# Forms & Content (replaces WordPress)

## Lead forms → API

The five public forms live in `apps/web` and post through a **server-side proxy** that attaches the
secret ingest key, so the key never reaches the browser:

```
LeadForm (client) ─► POST /api/lead (Next route, adds x-goldway-key)
                     ─► POST {API}/forms/{source} (NestJS)
```

`source` ∈ `medicare` `final-expense` `reverse-mortgage` `probate` `recruiting`.

### Safe fields (allow-listed by the DTO)
`firstName, lastName, email, phone, city, state, zipCode, preferredContactMethod,
preferredContactTime, serviceInterest, consentGiven, sourcePageUrl, utmSource, utmMedium,
utmCampaign` + honeypot `website`.

**Blocked at the boundary** (value discarded, name recorded): any field named like `medications`,
`medicalConditions`, `medicareCardNumber`, `coverage`, `existingPlan`, `enrollment`, `diagnosis`,
`ssn`, `dob`, … On Medicare forms, free-text `message/notes` is stripped entirely. Two layers enforce
this: `ComplianceService.stripBlockedFields` + the global `ValidationPipe({whitelist:true})`.

Medicare forms display: *"Please do not include medical, prescription, health, coverage, or
enrollment details in this form."*

## Content / Resource Center (custom CMS)

WordPress is replaced by a content module:

- **Admin** composes articles (`apps/web/.../admin/(panel)/content`, `Composer.tsx`) → `POST/PATCH /content`,
  `submit-review`, `approve`, `publish`. Compliance scan runs on every save; publishing is blocked while
  any **block**-severity phrase is present, and (when `COMPLIANCE_REVIEW_REQUIRED=true`) requires APPROVED.
- **Public** Resource Center reads **published** posts from `GET /public/resource-center` and
  `/public/resource-center/:slug`, rendered by `apps/web/.../resource-center` with dynamic SEO metadata,
  Open Graph, and Article JSON-LD.

"Publishing to the site" = marking the post `PUBLISHED` (the Next.js Resource Center serves it
immediately). Optional social fan-out records a per-platform `SocialPost` status (see SOCIAL doc).
