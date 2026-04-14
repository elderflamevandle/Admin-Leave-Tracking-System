import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return NextResponse.json(
        { success: false, error: strengthError },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, forcePasswordChange: false },
    });

    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await db.session.deleteMany({ where: { userId: resetToken.userId } });

    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({
      userId: resetToken.userId,
      eventKey: "auth.password_reset",
      details: `Password reset completed for ${resetToken.user.email}`,
      ipAddress,
      userAgent,
      module: "Auth",
    });

    return NextResponse.json({
      success: true,
      data: { message: "Password reset successful. Please log in." },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
