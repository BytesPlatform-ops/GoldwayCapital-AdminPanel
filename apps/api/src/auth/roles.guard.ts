import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { roleHasPermission, type Permission } from "../common/constants";
import type { AuthUser } from "./current-user.decorator";

/** Enforces @RequirePermissions(...) against the authenticated user's role. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user) throw new ForbiddenException("Not authenticated");

    const ok = required.every((perm) => roleHasPermission(user.role, perm));
    if (!ok) throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}
