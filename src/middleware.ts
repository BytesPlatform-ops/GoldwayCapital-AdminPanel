import { NextRequest, NextResponse } from "next/server";

// Presence-check guard for /admin. Token validity is enforced by the API; if the
// cookie is missing we redirect to login immediately.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("goldway_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
