import { NextRequest, NextResponse } from "next/server";

/**
 * CORS for the API-only backend. No wildcard: only the admin frontend and the
 * WordPress public website may call the API from a browser, and credentials
 * are allowed only for those exact origins. Server-to-server callers (the
 * frontend's server components, GHL webhooks) send no Origin header and are
 * unaffected. Auth itself is enforced inside every /api/admin route handler.
 */
const ALLOWED_ORIGINS = new Set(
  [
    process.env.FRONTEND_ORIGIN,
    process.env.WORDPRESS_ORIGIN,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
  ].filter((o): o is string => !!o).map((o) => o.replace(/\/+$/, ""))
);

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Goldway-Key",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = origin && ALLOWED_ORIGINS.has(origin.replace(/\/+$/, ""));

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: allowed ? corsHeaders(origin) : { Vary: "Origin" } });
  }

  const res = NextResponse.next();
  if (allowed) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  }
  return res;
}

export const config = { matcher: ["/api/:path*"] };
