import { Body, Controller, ForbiddenException, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { Request } from "express";
import type { LeadSource } from "@prisma/client";
import { FormsService } from "./forms.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { AppConfigService } from "../config/app-config.service";

/**
 * PUBLIC endpoints the website posts each form to. Protected by a shared ingest
 * key (x-goldway-key) rather than a user session.
 */
@Controller("forms")
export class FormsController {
  constructor(private readonly forms: FormsService, private readonly config: AppConfigService) {}

  private assertKey(key?: string) {
    if (this.config.leadApiIngestKey && key !== this.config.leadApiIngestKey) {
      throw new ForbiddenException("Invalid ingest key");
    }
  }

  private ctx(req: Request) {
    return {
      ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    };
  }

  private handle(source: LeadSource, dto: CreateLeadDto, req: Request, key?: string) {
    this.assertKey(key);
    return this.forms.intake(source, dto, req.body as Record<string, unknown>, this.ctx(req));
  }

  @Post("medicare") @HttpCode(201)
  medicare(@Body() dto: CreateLeadDto, @Req() req: Request, @Headers("x-goldway-key") key?: string) {
    return this.handle("MEDICARE", dto, req, key);
  }

  @Post("final-expense") @HttpCode(201)
  finalExpense(@Body() dto: CreateLeadDto, @Req() req: Request, @Headers("x-goldway-key") key?: string) {
    return this.handle("FINAL_EXPENSE", dto, req, key);
  }

  @Post("reverse-mortgage") @HttpCode(201)
  reverse(@Body() dto: CreateLeadDto, @Req() req: Request, @Headers("x-goldway-key") key?: string) {
    return this.handle("REVERSE_MTG", dto, req, key);
  }

  @Post("probate") @HttpCode(201)
  probate(@Body() dto: CreateLeadDto, @Req() req: Request, @Headers("x-goldway-key") key?: string) {
    return this.handle("PROBATE", dto, req, key);
  }

  @Post("recruiting") @HttpCode(201)
  recruiting(@Body() dto: CreateLeadDto, @Req() req: Request, @Headers("x-goldway-key") key?: string) {
    return this.handle("RECRUITING", dto, req, key);
  }
}
