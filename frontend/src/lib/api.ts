/**
 * Server-side client for the Goldway backend API. All calls run in Server
 * Components / Route Handlers (never the browser), so there is no CORS or
 * cross-origin cookie concern — the public site is fully anonymous.
 */
export const BACKEND_URL = (
  process.env.BACKEND_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

export async function backendGet<T>(path: string, revalidateSeconds = 120): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`backend GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}
