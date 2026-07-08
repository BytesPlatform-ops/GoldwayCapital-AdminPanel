import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * SAFE FIELDS ONLY. class-validator + the global whitelist pipe drop any field
 * not declared here — a structural guard against health/coverage data. The
 * ComplianceService additionally strips known health field names before this runs.
 */
export class CreateLeadDto {
  @IsString() @MaxLength(80) firstName!: string;
  @IsString() @MaxLength(80) lastName!: string;

  @IsOptional() @IsEmail() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(40) state?: string;
  @IsOptional() @IsString() @MaxLength(12) zipCode?: string;

  @IsOptional() @IsIn(["phone", "email"]) preferredContactMethod?: string;
  @IsOptional() @IsIn(["morning", "afternoon", "evening", "anytime"]) preferredContactTime?: string;
  @IsOptional() @IsString() @MaxLength(160) serviceInterest?: string;

  @IsOptional() @IsBoolean() consentGiven?: boolean;

  @IsOptional() @IsString() @MaxLength(500) sourcePageUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) utmSource?: string;
  @IsOptional() @IsString() @MaxLength(120) utmMedium?: string;
  @IsOptional() @IsString() @MaxLength(120) utmCampaign?: string;

  // Honeypot — bots fill it; humans never see it. Must be empty.
  @IsOptional() @IsString() @MaxLength(0) website?: string;

  // Anti-spam tokens (verified, never stored).
  @IsOptional() @IsString() turnstileToken?: string;
  @IsOptional() @IsString() recaptchaToken?: string;
}
