import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createAccessToken,
  createRefreshToken,
  verifyPassword,
  hashToken,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import type { RoleName } from "@/types";

export const dynamic = 'force-dynamic';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getClientInfo(request);

    const recentAttempts = await db.loginAttempt.count({
      where: {
        email,
        attemptedAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      },
    });

    if (recentAttempts >= LOCKOUT_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: "Account temporarily locked. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user?.id },
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user.id },
      });
      await logAudit({
        userId: user.id,
        eventKey: "auth.login_failed",
        details: `Failed login attempt for ${email}`,
        ipAddress,
        userAgent,
        module: "Auth",
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const roleName = user.role.name as RoleName;
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });
    const refreshToken = await createRefreshToken({ sub: user.id }, rememberMe);

    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshTokenExpiry(rememberMe),
        ipAddress,
        userAgent,
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await db.loginAttempt.deleteMany({ where: { email } });

    await logAudit({
      userId: user.id,
      eventKey: "auth.login",
      details: `User ${user.fullName} logged in`,
      ipAddress,
      userAgent,
      module: "Auth",
    });

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleName,
          permissions: user.role.permissions,
          department: user.department,
          avatarUrl: user.avatarUrl,
          forcePasswordChange: user.forcePasswordChange,
        },
      },
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
