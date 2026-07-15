import { authFetch } from "./api";
import type { Me } from "@/types";

export type { Me };

/** Current admin user, verified by the backend via GET /api/auth/me. */
export async function getMe(): Promise<Me | null> {
  try {
    const res = await authFetch("/me");
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: Me | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}
