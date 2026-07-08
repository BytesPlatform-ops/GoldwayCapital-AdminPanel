import { cookies } from "next/headers";
import { API_BASE } from "./api";

const COOKIE = "goldway_session";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** Reads the current admin user from the NestJS API using the session cookie. */
export async function getMe(): Promise<Me | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { cookie: `${COOKIE}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: Me };
    return data.user;
  } catch {
    return null;
  }
}
