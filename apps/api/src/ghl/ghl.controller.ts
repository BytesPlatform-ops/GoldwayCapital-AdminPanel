import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { GhlService } from "./ghl.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("ghl")
export class GhlController {
  constructor(private readonly ghl: GhlService) {}

  @Get("status")
  status() {
    return this.ghl.status();
  }

  @RequirePermissions("integrations.manage")
  @Post("sync-lead/:id")
  syncLead(@Param("id") id: string) {
    return this.ghl.syncLead(id);
  }

  @RequirePermissions("integrations.manage")
  @Post("retry-failed")
  retryFailed() {
    return this.ghl.retryFailed();
  }
}
