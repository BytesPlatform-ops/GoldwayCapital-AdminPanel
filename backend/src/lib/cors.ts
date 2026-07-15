import { NextResponse } from "next/server";

/**
 * App-layer CORS for the public, browser-facing routes (replaces the old edge
 * middleware, which broke /api forwarding on Netlify). Admin routes are called
 * server-side with cookies and need no CORS.
 *
 * Only the configured origins are reflected — never a wildcard — and credentials
 * are allowed only for those exact origins.
 */
const ALLOWED_ORIGINS = new Set(
  [
    process.env.FRONTEND_ORIGIN,
    process.env.WORDPRESS_ORIGIN,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
  ]
    .filter((o): o is string => !!o)
    .map((o) => o.replace(/\/+$/, ""))
);

export function corsHeadersFor(origin: string | null): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.has(origin.replace(/\/+$/, ""))) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Goldway-Key",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    };
  }
  return { Vary: "Origin" };
}

/** Add CORS headers to a route response based on the request Origin. */
export function withCors(res: NextResponse, req: Request): NextResponse {
  for (const [k, v] of Object.entries(corsHeadersFor(req.headers.get("origin")))) res.headers.set(k, v);
  return res;
}

/** Preflight (OPTIONS) response for a browser-facing route. */
export function preflight(req: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(req.headers.get("origin")) });
}
