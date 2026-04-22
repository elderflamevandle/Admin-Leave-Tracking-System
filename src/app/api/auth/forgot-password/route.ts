import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const successResponse = NextResponse.json({
      success: true,
      data: { message: "If this email exists, a reset link has been sent." },
    });

    if (!email) return successResponse;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return successResponse;

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const resetToken = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(email, resetToken).catch((err) =>
      console.error("Failed to send reset email:", err)
    );

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
