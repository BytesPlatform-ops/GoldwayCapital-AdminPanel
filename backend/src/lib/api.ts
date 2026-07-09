import { cookies, headers } from "next/headers";

/**
 * Server-side data client for admin Server Components. Talks to this same
 * Next.js app's /api routes over same-origin HTTP, forwarding the session
 * cookie. (Reading headers()/cookies() also opts these pages into dynamic
 * rendering, so nothing is fetched at build time.)
 */
export function originBase(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${originBase()}/api${path}`, {
    headers: { cookie: cookies().toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return (await res.json()) as T;
}

/** Server-side mutation that forwards the session cookie. */
export async function apiSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${originBase()}/api${path}`, {
    method,
    headers: { cookie: cookies().toString(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return (await res.json().catch(() => ({}))) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}
