import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { GhlSyncStatus, LeadSource, PipelineStage } from "@prisma/client";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import {
  CreateAppointmentDto,
  CreateCallLogDto,
  CreateEmailLogDto,
  CreateNoteDto,
  CreateTaskDto,
  UpdateLeadDto,
  UpdateStageDto,
} from "./dto/lead-dtos";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @RequirePermissions("leads.view")
  @Get()
  list(
    @Query("q") q?: string,
    @Query("source") source?: LeadSource,
    @Query("stage") stage?: PipelineStage,
    @Query("syncStatus") syncStatus?: GhlSyncStatus,
    @Query("assignedToId") assignedToId?: string
  ) {
    return this.leads.list({ q, source, stage, syncStatus, assignedToId });
  }

  @RequirePermissions("leads.view")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.leads.get(id);
  }

  @RequirePermissions("leads.update")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leads.update(id, dto, user);
  }

  @RequirePermissions("leads.stage_change")
  @Patch(":id/stage")
  stage(@Param("id") id: string, @Body() dto: UpdateStageDto, @CurrentUser() user: AuthUser) {
    return this.leads.changeStage(id, dto.stage, user);
  }

  @RequirePermissions("notes.create")
  @Post(":id/notes")
  note(@Param("id") id: string, @Body() dto: CreateNoteDto, @CurrentUser() user: AuthUser) {
    return this.leads.addNote(id, dto, user);
  }

  @RequirePermissions("calls.create")
  @Post(":id/call-logs")
  call(@Param("id") id: string, @Body() dto: CreateCallLogDto, @CurrentUser() user: AuthUser) {
    return this.leads.addCallLog(id, dto, user);
  }

  @RequirePermissions("emails.send")
  @Post(":id/email-logs")
  emailLog(@Param("id") id: string, @Body() dto: CreateEmailLogDto, @CurrentUser() user: AuthUser) {
    return this.leads.addEmailLog(id, dto, user);
  }

  @RequirePermissions("tasks.manage")
  @Post(":id/tasks")
  task(@Param("id") id: string, @Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.leads.addTask(id, dto, user);
  }

  @RequirePermissions("appointments.manage")
  @Post(":id/appointments")
  appointment(@Param("id") id: string, @Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.leads.addAppointment(id, dto, user);
  }
}
