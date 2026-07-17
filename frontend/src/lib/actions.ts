"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiBase, apiGet, authFetch } from "./api";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./session";
import type { NotificationItem } from "./notifications";

export interface LoginState {
  error?: string;
}

/** Logs in against the backend API and stores the returned JWT in an httpOnly cookie. */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  let token: string | undefined;
  try {
    const res = await authFetch("/login", { method: "POST", body: { email, password } });
    // 401 = bad credentials from the backend. Any other non-OK (404/5xx) points
    // at a misconfigured backend URL rather than the user's password.
    if (res.status === 401) return { error: "Invalid email or password." };
    if (!res.ok) return { error: "Could not reach the API. Please try again." };
    token = ((await res.json()) as { token?: string }).token;
  } catch {
    // fetch threw → network / CORS / DNS failure reaching the backend.
    return { error: "Could not reach the API. Please try again." };
  }
  if (!token) return { error: "Login failed." };

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  await authFetch("/logout", { method: "POST" }).catch(() => undefined);
  cookies().delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/** Generic authed mutation used by admin client components. Hits the backend /api/admin. */
export async function apiMutate(path: string, method: string, body?: unknown, revalidate?: string) {
  const res = await fetch(`${apiBase()}/api/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: cookies().toString() },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (revalidate) revalidatePath(revalidate);
  return { ok: res.ok, status: res.status, data };
}

/** Header notification feed. Returns [] on any error so the bell never breaks the page. */
export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    return await apiGet<NotificationItem[]>("/notifications");
  } catch {
    return [];
  }
}
