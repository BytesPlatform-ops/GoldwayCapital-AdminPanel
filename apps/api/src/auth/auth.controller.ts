import { Body, Controller, Get, Post, Res, UseGuards, HttpCode } from "@nestjs/common";
import { Response } from "express";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser, type AuthUser } from "./current-user.decorator";

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) password!: string;
}

const COOKIE = "goldway_session";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validate(dto.email, dto.password);
    const token = await this.auth.signToken(user);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });
    return { user, token };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: "/" });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
