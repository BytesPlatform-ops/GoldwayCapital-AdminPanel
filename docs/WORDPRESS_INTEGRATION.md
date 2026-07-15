# WordPress → backend lead forms

The WordPress site posts leads to the backend, which is the only place that holds
the GHL private integration token. **WordPress never talks to GHL directly and
never receives the GHL token.** The only shared secret WordPress needs is
`LEAD_API_INGEST_KEY` (sent as the `x-goldway-key` header), and even that should
live in a server-side WordPress setting, not in page JS.

Endpoint: `POST https://api.goldwaycapital.com/api/public/leads/submit`

## Per-form `formType`
| Website form | `formType` |
|---|---|
| Medicare | `medicare` |
| Final Expense | `final-expense` |
| Reverse Mortgage | `reverse-mtg` |
| Probate / Senior Real Estate | `probate` |
| Recruiting / Careers | `recruiting` |

Field names per form are in [LEAD_TEST_PAYLOADS.md](./LEAD_TEST_PAYLOADS.md).

## Required hidden fields (every form)
- `leadSource` — set server-side from `formType`; the site may also send it
- `campaign` — UTM/campaign name
- `landingPageUrl` — the page URL the form was submitted from
- `submissionDateTime` — ISO timestamp (backend fills if omitted)
- `emailConsent` — `Yes`/`No` from the email-consent checkbox
- `smsConsent` — `Yes`/`No` from the SMS-consent checkbox
- `tcpaConsentTimestamp` — ISO timestamp captured when consent was checked
  (backend fills if omitted)

## Consent rules
- The consent UI must mention **email** and **SMS** consent **separately** — one
  checkbox each, not a single combined checkbox.
- Do **not** send `smsConsent: "Yes"` unless the SMS box is checked. SMS follow-up
  in GHL keys off this value.

## Recommended: server-side proxy (keeps the ingest key off the page)
Add to the theme (or a small mu-plugin). The browser posts to
`admin-ajax.php`; PHP forwards to the backend with the header.

```php
// functions.php
add_action('wp_ajax_nopriv_goldway_lead', 'goldway_lead');
add_action('wp_ajax_goldway_lead', 'goldway_lead');
function goldway_lead() {
    $backend = 'https://api.goldwaycapital.com/api/public/leads/submit';
    $body    = wp_kses_post_deep(wp_unslash($_POST['lead'] ?? []));
    $res = wp_remote_post($backend, [
        'headers' => [
            'Content-Type' => 'application/json',
            // Store the key in wp-config.php / env, never in page markup.
            'x-goldway-key' => defined('GOLDWAY_INGEST_KEY') ? GOLDWAY_INGEST_KEY : '',
        ],
        'body'    => wp_json_encode($body),
        'timeout' => 15,
    ]);
    if (is_wp_error($res)) { wp_send_json_error(['message' => 'Submit failed'], 502); }
    $code = wp_remote_retrieve_response_code($res);
    $json = json_decode(wp_remote_retrieve_body($res), true);
    wp_send_json($json, $code);
}
```

```js
// Front-end: post the form, then show the thank-you state + booking link.
async function submitGoldwayLead(formType, fields) {
  const payload = {
    formType,
    landingPageUrl: window.location.href,
    submissionDateTime: new Date().toISOString(),
    ...fields, // firstName, lastName, phone, email, consents, vertical answers…
  };
  const res = await fetch(goldway_ajax.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ action: 'goldway_lead', lead: JSON.stringify(payload) }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error('Submit failed');
  // data.calendarLink → render "Book your consultation" button.
  showThankYou(data.calendarLink);
}
```

## After a successful submit
- Show the thank-you page/state.
- If the design supports it, render the returned `calendarLink` as the booking
  button (each vertical returns its own link).
- Never surface `ghlContactId`, `ghlOpportunityId`, or any backend internals to
  the visitor beyond the confirmation.

## Do not
- Put the GHL token, GHL ids, or GHL API URLs in WordPress, page JS, or theme env.
- Post directly to `services.leadconnectorhq.com` from the browser or WordPress.
