import { getSessionUser } from "./auth/session";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** Current admin user, read + verified from the session cookie (no network). */
export async function getMe(): Promise<Me | null> {
  return getSessionUser();
}
