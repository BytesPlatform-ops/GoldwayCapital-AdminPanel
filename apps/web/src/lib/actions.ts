"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { API_BASE } from "./api";

const COOKIE = "goldway_session";

export interface LoginState {
  error?: string;
}

/**
 * Bridges NestJS auth into a first-party cookie: call the API, capture the JWT,
 * and set it as an httpOnly cookie on the web origin so SSR pages can forward it.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  let token: string | undefined;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) return { error: "Invalid email or password." };
    token = (await res.json()).token;
  } catch {
    return { error: "Cannot reach the API. Is the backend running?" };
  }
  if (!token) return { error: "Login failed." };

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60,
    path: "/",
  });
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  cookies().delete(COOKIE);
  redirect("/admin/login");
}

/** Generic authed mutation used by admin client components. Returns the JSON. */
export async function apiMutate(path: string, method: string, body?: unknown, revalidate?: string) {
  const token = cookies().get(COOKIE)?.value ?? "";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: `${COOKIE}=${token}` },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (revalidate) revalidatePath(revalidate);
  return { ok: res.ok, status: res.status, data };
}
