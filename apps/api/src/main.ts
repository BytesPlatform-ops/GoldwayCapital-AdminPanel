import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix("");
  app.use(cookieParser());

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  // Whitelist strips unknown props — a defense-in-depth layer for the health-data
  // boundary: any field not on a DTO is dropped before it reaches a service.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  new Logger("Bootstrap").log(`Goldway API listening on http://localhost:${port}`);
}
bootstrap();
