import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";
import type { RoleName } from "@/types";

export const dynamic = "force-dynamic";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token" },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const tokenHash = hashToken(refreshToken);
    const session = await db.session.findFirst({
      where: {
        userId: payload.sub,
        refreshTokenHash: tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 }
      );
    }

    const roleName = user.role.name as RoleName;
    const isLongSession =
      session.expiresAt.getTime() - Date.now() > 7 * 24 * 60 * 60 * 1000;

    const newAccessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });

    // Rotate refresh token on every use — invalidates stolen tokens
    const newRefreshToken = await createRefreshToken({ sub: user.id }, isLongSession);
    const { ipAddress, userAgent } = getClientInfo(request);

    await db.$transaction([
      db.session.delete({ where: { id: session.id } }),
      db.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newAccessToken),
          refreshTokenHash: hashToken(newRefreshToken),
          expiresAt: getRefreshTokenExpiry(isLongSession),
          ipAddress,
          userAgent,
        },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      data: {
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

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "strict",
      path: "/",
      maxAge: isLongSession ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    logger.error("Token refresh error", { error: String(error) });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
