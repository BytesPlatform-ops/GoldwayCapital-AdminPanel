import { Body, Controller, Get, Injectable, Module, Param, Patch, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LeadsService } from "../leads/leads.service";
import { LeadsModule } from "../leads/leads.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { UpdateStageDto } from "../leads/dto/lead-dtos";

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}
  // Board excludes recruiting leads (they have their own section).
  board() {
    return this.prisma.lead.findMany({
      where: { leadSource: { not: "RECRUITING" } },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, firstName: true, lastName: true, leadSource: true, pipelineStage: true, ghlSyncStatus: true },
    });
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("pipeline")
class PipelineController {
  constructor(private readonly svc: PipelineService, private readonly leads: LeadsService) {}

  @RequirePermissions("leads.view") @Get()
  board() {
    return this.svc.board();
  }

  @RequirePermissions("leads.stage_change") @Patch("leads/:id/move")
  move(@Param("id") id: string, @Body() dto: UpdateStageDto, @CurrentUser() user: AuthUser) {
    return this.leads.changeStage(id, dto.stage, user);
  }
}

@Module({ imports: [LeadsModule], providers: [PipelineService], controllers: [PipelineController] })
export class PipelineModule {}
