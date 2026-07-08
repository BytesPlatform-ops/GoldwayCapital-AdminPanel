import { Global, Module } from "@nestjs/common";
import { GhlService } from "./ghl.service";
import { GhlController } from "./ghl.controller";

@Global()
@Module({
  providers: [GhlService],
  controllers: [GhlController],
  exports: [GhlService],
})
export class GhlModule {}
