import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { fullName, email, roleId, department, isActive, leaveBalance } = body;

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(roleId && { roleId }),
      ...(department !== undefined && { department }),
      ...(isActive !== undefined && { isActive }),
      ...(leaveBalance !== undefined && { leaveBalance }),
    },
    include: { role: true },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "users.updated", details: `Updated user ${id}`, metadata: { updatedUserId: id }, ipAddress, userAgent, module: "Admin" });

  const { passwordHash: _, ...safeUser } = updated;
  return NextResponse.json({ success: true, data: safeUser });
}
