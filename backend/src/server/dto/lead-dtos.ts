import type { CallOutcome, PipelineStage, RecruitingStatus, SoaStatus } from "@prisma/client";

export interface UpdateStageDto {
  stage: PipelineStage;
}

export interface UpdateLeadDto {
  assignedToId?: string | null;
  nextFollowUpAt?: string | null;
  soaStatus?: SoaStatus;
  recruitingStatus?: RecruitingStatus;
  closedStatus?: string;
  closedReason?: string;
}

export interface CreateNoteDto {
  body: string;
}

export interface CreateCallLogDto {
  outcome: CallOutcome;
  notes?: string;
  followUpNeeded?: boolean;
}

export interface CreateEmailLogDto {
  subject: string;
  body: string;
  direction?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueAt?: string;
  assignedToId?: string;
}

export interface CreateAppointmentDto {
  serviceType: string;
  scheduledAt: string;
  location?: string;
  notes?: string;
}
