import { IsBoolean, IsDateString, IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { CallOutcome, PipelineStage, RecruitingStatus, SoaStatus } from "@prisma/client";

export class UpdateStageDto {
  @IsEnum(PipelineStage) stage!: PipelineStage;
}

export class UpdateLeadDto {
  @IsOptional() @IsString() assignedToId?: string | null;
  @IsOptional() @IsDateString() nextFollowUpAt?: string | null;
  @IsOptional() @IsEnum(SoaStatus) soaStatus?: SoaStatus;
  @IsOptional() @IsEnum(RecruitingStatus) recruitingStatus?: RecruitingStatus;
  @IsOptional() @IsString() @MaxLength(120) closedStatus?: string;
  @IsOptional() @IsString() @MaxLength(400) closedReason?: string;
}

export class CreateNoteDto {
  @IsString() @MaxLength(4000) body!: string;
}

export class CreateCallLogDto {
  @IsEnum(CallOutcome) outcome!: CallOutcome;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsBoolean() followUpNeeded?: boolean;
}

export class CreateEmailLogDto {
  @IsString() @MaxLength(200) subject!: string;
  @IsString() @MaxLength(8000) body!: string;
  @IsOptional() @IsIn(["outbound", "inbound"]) direction?: string;
}

export class CreateTaskDto {
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

export class CreateAppointmentDto {
  @IsString() @MaxLength(60) serviceType!: string;
  @IsDateString() scheduledAt!: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
