import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders, hashPassword } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const { fullName, email, roleId, department, joinDate, sendWelcome = true } = body;

  if (!fullName || !email || !roleId) {
    return NextResponse.json({ success: false, error: "Name, email, and role are required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });

  const tempPassword = crypto.randomBytes(8).toString("hex").slice(0, 12) + "A1!";
  const passwordHash = await hashPassword(tempPassword);

  const user = await db.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      roleId,
      department,
      joinDate: joinDate ? new Date(joinDate) : undefined,
      forcePasswordChange: true,
    },
    include: { role: true },
  });

  if (sendWelcome) {
    sendWelcomeEmail(email, fullName, tempPassword).catch((e) => console.error("Welcome email failed:", e));
  }

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "users.created", details: `Created user ${email}`, metadata: { newUserId: user.id }, ipAddress, userAgent, module: "Admin" });

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ success: true, data: { user: safeUser, tempPassword: sendWelcome ? undefined : tempPassword } }, { status: 201 });
}
