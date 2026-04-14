import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders, hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAudit, getClientInfo } from "@/lib/audit";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  await db.passwordResetToken.updateMany({ where: { userId: id, usedAt: null }, data: { usedAt: new Date() } });

  const resetToken = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { userId: id, tokenHash: hashToken(resetToken), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  sendPasswordResetEmail(user.email, resetToken).catch(console.error);

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "users.password_reset_sent", details: `Password reset sent to ${user.email}`, ipAddress, userAgent, module: "Admin" });

  return NextResponse.json({ success: true, data: { message: "Reset email sent" } });
}
