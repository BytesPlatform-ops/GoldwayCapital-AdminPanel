import { Global, Module } from "@nestjs/common";
import { IntegrationLogsService } from "./integration-logs.service";

@Global()
@Module({
  providers: [IntegrationLogsService],
  exports: [IntegrationLogsService],
})
export class IntegrationLogsModule {}
