import { cookies } from "next/headers";

/**
 * The one API client for the admin frontend. Every page and action talks to
 * the backend deployment (api.goldwaycapital.com) through here — this app has
 * no database, no Prisma, no GHL code, and no secrets.
 *
 * Calls run server-side (Server Components / Server Actions) and forward the
 * session cookie set at login. Reading cookies() also opts pages into dynamic
 * rendering, so nothing is fetched at build time.
 */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}

function authHeaders(): Record<string, string> {
  return { cookie: cookies().toString() };
}

/** GET an admin API resource, e.g. apiGet("/leads") → GET {API}/api/admin/leads. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}/api/admin${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return (await res.json()) as T;
}

/** Mutate an admin API resource, e.g. apiSend("/leads/1/stage", "PATCH", {...}). */
export async function apiSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}/api/admin${path}`, {
    method,
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return (await res.json().catch(() => ({}))) as T;
}

/** Auth endpoints live outside /api/admin: authFetch("/login", ...) → {API}/api/auth/login. */
export async function authFetch(path: string, init?: { method?: string; body?: unknown }): Promise<Response> {
  return fetch(`${apiBase()}/api/auth${path}`, {
    method: init?.method ?? "GET",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
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
