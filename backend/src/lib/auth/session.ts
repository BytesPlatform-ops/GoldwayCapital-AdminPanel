import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { config } from "@/lib/config";
import { roleHasPermission, type Permission } from "@/lib/constants";
import { ForbiddenException, UnauthorizedException } from "@/lib/errors";
import type { AuthUser } from "@/types";

export const SESSION_COOKIE = "goldway_session";
export const SESSION_MAX_AGE = 8 * 60 * 60; // seconds

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: "8h" }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const p = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    return { id: String(p.sub), email: p.email, name: p.name, role: p.role };
  } catch {
    return null;
  }
}

/** Current user from the httpOnly session cookie, or null. */
export function getSessionUser(): AuthUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/** Throws 401 when unauthenticated. */
export function requireUser(): AuthUser {
  const user = getSessionUser();
  if (!user) throw new UnauthorizedException("Missing authentication token");
  return user;
}

/** Throws 401/403 unless the user holds the permission. */
export function requirePermission(perm: Permission): AuthUser {
  const user = requireUser();
  if (!roleHasPermission(user.role, perm)) throw new ForbiddenException("Insufficient permissions");
  return user;
}
