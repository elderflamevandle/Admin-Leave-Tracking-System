import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders, hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { role: true },
  });
  if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ success: true, data: safeUser });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, department, currentPassword, newPassword } = body;

  if (currentPassword && newPassword) {
    const user = await db.user.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return NextResponse.json({ success: false, error: strengthError }, { status: 400 });

    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash: await hashPassword(newPassword), forcePasswordChange: false },
    });
    await db.session.deleteMany({ where: { userId: auth.userId } });

    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({ userId: auth.userId, eventKey: "auth.password_reset", details: "User changed their password", ipAddress, userAgent, module: "Auth" });

    return NextResponse.json({ success: true, data: { message: "Password changed" } });
  }

  const updated = await db.user.update({
    where: { id: auth.userId },
    data: {
      ...(fullName && { fullName }),
      ...(department !== undefined && { department }),
    },
  });
  const { passwordHash: _, ...safeUser } = updated;
  return NextResponse.json({ success: true, data: safeUser });
}
