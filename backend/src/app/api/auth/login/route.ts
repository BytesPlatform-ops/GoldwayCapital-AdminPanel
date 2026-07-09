import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateUser, signToken } from "@/server/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";
import { HttpError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ statusCode: 400, message: "Email and password are required." }, { status: 400 });
    const user = await validateUser(email, password);
    const token = signToken(user);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return NextResponse.json({ user, token });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ statusCode: e.status, message: e.message }, { status: e.status });
    return NextResponse.json({ statusCode: 500, message: "Login failed." }, { status: 500 });
  }
}
