import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfigService } from "../config/app-config.service";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "./current-user.decorator";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly audit: AuditService
  ) {}

  async validate(email: string, password: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.isActive) throw new UnauthorizedException("Invalid email or password");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid email or password");

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({ actorId: user.id, action: "user.login", entityType: "user", entityId: user.id });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async signToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      { secret: this.config.jwtSecret, expiresIn: "8h" }
    );
  }

  static hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }
}
