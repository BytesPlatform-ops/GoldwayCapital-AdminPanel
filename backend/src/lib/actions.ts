"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { originBase } from "./api";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./auth/session";
import { validateUser, signToken } from "@/server/auth";

export interface LoginState {
  error?: string;
}

/** Authenticates against this app's own auth logic and sets the session cookie. */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  try {
    const user = await validateUser(email, password);
    const token = signToken(user);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  } catch {
    return { error: "Invalid email or password." };
  }
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/** Generic authed mutation used by admin client components. Hits same-origin /api. */
export async function apiMutate(path: string, method: string, body?: unknown, revalidate?: string) {
  const res = await fetch(`${originBase()}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: cookies().toString() },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (revalidate) revalidatePath(revalidate);
  return { ok: res.ok, status: res.status, data };
}
