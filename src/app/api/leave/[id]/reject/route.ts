import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { sendLeaveStatusEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const canReject = auth.role === "admin" || auth.role === "manager";
  if (!canReject) {
    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { note } = body;

  if (!note) return NextResponse.json({ success: false, error: "Rejection note is required" }, { status: 400 });

  const leave = await db.leaveRequest.findUnique({
    where: { id },
    include: { user: { select: { fullName: true, email: true, managerId: true } } },
  });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.status !== "pending") {
    return NextResponse.json({ success: false, error: "Leave request is not pending" }, { status: 400 });
  }

  if (auth.role === "manager" && leave.user.managerId !== auth.userId) {
    return NextResponse.json({ success: false, error: "You can only reject your direct reports' leaves" }, { status: 403 });
  }

  const updated = await db.leaveRequest.update({
    where: { id },
    data: { status: "rejected", reviewedBy: auth.userId, reviewerNote: note },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "leave.rejected", details: `Rejected leave request ${id}: ${note}`, metadata: { leaveRequestId: id }, ipAddress, userAgent, module: "Leave" });
  await createNotification({ userId: leave.userId, title: "Leave Rejected", message: `Your leave request was rejected: ${note}`, link: "/leave" });
  await sendLeaveStatusEmail(
    leave.user.email,
    leave.user.fullName,
    "rejected",
    leave.leaveType,
    leave.startDate.toISOString().split("T")[0],
    leave.endDate.toISOString().split("T")[0],
    note
  );

  return NextResponse.json({ success: true, data: updated });
}
