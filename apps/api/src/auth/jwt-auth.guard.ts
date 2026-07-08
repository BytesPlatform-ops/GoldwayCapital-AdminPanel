import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AppConfigService } from "../config/app-config.service";

/** Verifies the JWT from the httpOnly cookie or the Authorization: Bearer header. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: AppConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extract(req);
    if (!token) throw new UnauthorizedException("Missing authentication token");
    try {
      const payload = await this.jwt.verifyAsync(token, { secret: this.config.jwtSecret });
      (req as any).user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extract(req: Request): string | null {
    const cookieToken = (req as any).cookies?.goldway_session;
    if (cookieToken) return cookieToken;
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) return auth.slice(7);
    return null;
  }
}
