"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiBase, authFetch } from "./api";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./session";

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
    if (!res.ok) return { error: "Invalid email or password." };
    token = ((await res.json()) as { token?: string }).token;
  } catch {
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
