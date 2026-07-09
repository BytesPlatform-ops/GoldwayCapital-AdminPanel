import { NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";

/**
 * Runs a route body, returning its value as JSON and mapping thrown HttpErrors
 * (and unknown errors) to consistent JSON responses. Mirrors the old NestJS
 * global exception filter.
 */
export async function handle(fn: () => Promise<unknown> | unknown, successStatus = 200): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true }, { status: successStatus });
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ statusCode: e.status, message: e.message }, { status: e.status });
    }
    console.error("[api] unhandled error:", e);
    return NextResponse.json({ statusCode: 500, message: "Internal server error" }, { status: 500 });
  }
}

/** Client IP + user-agent for a request (used by the public form intake). */
export function requestContext(req: Request): { ip: string | null; userAgent: string | null } {
  const fwd = req.headers.get("x-forwarded-for");
  return { ip: fwd ? fwd.split(",")[0].trim() : null, userAgent: req.headers.get("user-agent") };
}
