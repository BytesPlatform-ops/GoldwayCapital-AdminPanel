/**
 * Compatibility shim: the services were ported from NestJS. This re-exports the
 * few `@nestjs/common` symbols they referenced (Logger + HTTP exceptions) so the
 * bodies are unchanged. `@Injectable()` decorators were removed during the port.
 */
export { Logger } from "./logger";
export { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from "./errors";

/** No-op stand-in for the removed `@Injectable()` decorator (import kept harmless). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Injectable = (): ClassDecorator => (_target: any) => undefined;
