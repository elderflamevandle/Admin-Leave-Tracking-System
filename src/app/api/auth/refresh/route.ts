import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAccessToken, verifyRefreshToken, hashToken } from "@/lib/auth";
import type { RoleName } from "@/types";

export const dynamic = 'force-dynamic';

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
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });

    await db.session.update({
      where: { id: session.id },
      data: { tokenHash: hashToken(accessToken) },
    });

    return NextResponse.json({
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
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
