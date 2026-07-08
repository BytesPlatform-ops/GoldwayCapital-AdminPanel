import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { ComplianceService } from "./compliance.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequirePermissions } from "../auth/permissions.decorator";

class CheckContentDto {
  @IsString() text!: string;
}
class UpdateDisclosureDto {
  @IsString() title!: string;
  @IsString() body!: string;
}

@Controller("compliance")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService, private readonly prisma: PrismaService) {}

  // Public: the content composer live-scans text. No auth needed to check a phrase.
  @Post("check-content")
  check(@Body() dto: CheckContentDto) {
    return this.compliance.scanText(dto.text ?? "");
  }

  @Get("rules")
  rules() {
    return this.compliance.getRules();
  }

  @Get("disclosures")
  disclosures() {
    return this.compliance.getDisclosures();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions("compliance.manage")
  @Patch("disclosures/:id")
  updateDisclosure(@Param("id") id: string, @Body() dto: UpdateDisclosureDto) {
    return this.prisma.disclosureBlock.update({ where: { id }, data: { title: dto.title, body: dto.body } });
  }
}
