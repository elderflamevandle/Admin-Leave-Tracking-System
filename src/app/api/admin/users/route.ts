import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getAuthFromHeaders, hashPassword } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function generateTempPassword(): string {
  // 16 random bytes → unique per invite, always passes strength validation
  return randomBytes(16).toString("base64url") + "A1!";
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const roleFilter = searchParams.get("role") ?? "";

  const where = {
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(roleFilter && { role: { name: roleFilter } }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { role: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
  return NextResponse.json({
    success: true,
    data: safeUsers,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  if (!rateLimits.adminOps(auth.userId)) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const { fullName, email, roleId, department, joinDate, sendWelcome = true } = body;

  if (!fullName || !email || !roleId) {
    return NextResponse.json(
      { success: false, error: "Name, email, and role are required" },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
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
    sendWelcomeEmail(email, fullName, tempPassword).catch((e) =>
      logger.error("Welcome email failed", { error: String(e) })
    );
  }

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "users.created",
    details: `Created user ${email}`,
    metadata: { newUserId: user.id },
    ipAddress,
    userAgent,
    module: "Admin",
  });

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json(
    {
      success: true,
      data: {
        user: safeUser,
        // Only return temp password when email is disabled so admin can relay it manually
        tempPassword: sendWelcome ? undefined : tempPassword,
      },
    },
    { status: 201 }
  );
}
