import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

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
  const leave = await db.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.status !== "pending") {
    return NextResponse.json({ success: false, error: "Leave request is not pending" }, { status: 400 });
  }

  if (leave.leaveType === "annual") {
    await db.user.update({
      where: { id: leave.userId },
      data: { leaveBalance: { decrement: leave.workingDays } },
    });
  }

  const updated = await db.leaveRequest.update({
    where: { id },
    data: { status: "approved", reviewedBy: auth.userId },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "leave.approved", details: `Approved leave request ${id}`, metadata: { leaveRequestId: id }, ipAddress, userAgent, module: "Leave" });
  await createNotification({ userId: leave.userId, title: "Leave Approved", message: "Your leave request has been approved.", link: "/leave" });

  return NextResponse.json({ success: true, data: updated });
}
