import { SetMetadata } from "@nestjs/common";
import type { Permission } from "../common/constants";

export const PERMISSIONS_KEY = "required_permissions";
/** Attach one or more required permissions to a route (checked by RolesGuard). */
export const RequirePermissions = (...perms: Permission[]) => SetMetadata(PERMISSIONS_KEY, perms);
