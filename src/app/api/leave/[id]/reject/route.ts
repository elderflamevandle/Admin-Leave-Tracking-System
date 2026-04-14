import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { note } = body;

  if (!note) return NextResponse.json({ success: false, error: "Rejection note is required" }, { status: 400 });

  const leave = await db.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.status !== "pending") {
    return NextResponse.json({ success: false, error: "Leave request is not pending" }, { status: 400 });
  }

  const updated = await db.leaveRequest.update({
    where: { id },
    data: { status: "rejected", reviewedBy: auth.userId, reviewerNote: note },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "leave.rejected", details: `Rejected leave request ${id}: ${note}`, metadata: { leaveRequestId: id }, ipAddress, userAgent, module: "Leave" });
  await createNotification({ userId: leave.userId, title: "Leave Rejected", message: `Your leave request was rejected: ${note}`, link: "/leave" });

  return NextResponse.json({ success: true, data: updated });
}
