"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    app.setGlobalPrefix("");
    app.use((0, cookie_parser_1.default)());
    const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    app.enableCors({ origin: origins, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const port = Number(process.env.API_PORT ?? 4000);
    await app.listen(port);
    new common_1.Logger("Bootstrap").log(`Goldway API listening on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map