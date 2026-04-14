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
  const { leaveBalance } = body;

  if (typeof leaveBalance !== "number") {
    return NextResponse.json({ success: false, error: "leaveBalance must be a number" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { leaveBalance },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "users.leave_balance_adjusted", details: `Leave balance for user ${id} set to ${leaveBalance}`, ipAddress, userAgent, module: "Admin" });

  return NextResponse.json({ success: true, data: { leaveBalance: updated.leaveBalance } });
}
