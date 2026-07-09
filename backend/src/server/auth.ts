import bcrypt from "bcryptjs";
import { prisma } from "@/db/prisma";
import { UnauthorizedException } from "@/lib/errors";
import { signToken } from "@/lib/auth/session";
import type { AuthUser } from "@/types";

/** Validate credentials, stamp last login, audit — returns the session user. */
export async function validateUser(email: string, password: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) throw new UnauthorizedException("Invalid email or password");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedException("Invalid email or password");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog
    .create({ data: { actorId: user.id, action: "user.login", entityType: "user", entityId: user.id } })
    .catch(() => undefined);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export { signToken };
