import { Global, Module } from "@nestjs/common";
import { WordpressService } from "./wordpress.service";

/** Global so ContentService and the Integrations controller can inject it directly. */
@Global()
@Module({
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule {}
