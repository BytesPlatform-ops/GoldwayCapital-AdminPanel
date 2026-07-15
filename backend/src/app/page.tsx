// API-only deployment — the admin UI lives in the separate frontend app.
export default function ApiRoot() {
  return (
    <pre style={{ padding: 24, fontFamily: "monospace" }}>
      {JSON.stringify(
        {
          service: "goldway-capital-api",
          status: "ok",
          routes: ["/api/auth/*", "/api/admin/*", "/api/public/leads/submit", "/api/webhooks/ghl"],
        },
        null,
        2
      )}
    </pre>
  );
}
