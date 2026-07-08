import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Injects the authenticated user (set by JwtAuthGuard) into a handler param. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
