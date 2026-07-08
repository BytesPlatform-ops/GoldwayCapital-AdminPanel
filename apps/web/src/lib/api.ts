import { cookies } from "next/headers";

/**
 * Server-side API client for talking to the NestJS backend.
 * Forwards the admin session cookie so authenticated admin pages work with SSR.
 */
const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const API_BASE = API;

export async function apiGet<T>(path: string): Promise<T> {
  const cookie = cookies().toString();
  const res = await fetch(`${API}${path}`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) throw new ApiError(res.status, await safeText(res));
  return (await res.json()) as T;
}

/** Server-side POST that forwards the session cookie (for admin server actions). */
export async function apiSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const cookie = cookies().toString();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { cookie, "Content-Type": "application/json" },
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
