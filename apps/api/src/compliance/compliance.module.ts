import { Global, Module } from "@nestjs/common";
import { ComplianceService } from "./compliance.service";
import { ComplianceController } from "./compliance.controller";

@Global()
@Module({
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
