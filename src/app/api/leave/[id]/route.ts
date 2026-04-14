import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leave = await db.leaveRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true } },
    },
  });

  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.userId !== auth.userId && auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: leave });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leave = await db.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.userId !== auth.userId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  if (leave.status !== "pending") return NextResponse.json({ success: false, error: "Only pending requests can be cancelled" }, { status: 400 });

  const body = await request.json();
  if (body.status === "cancelled") {
    const updated = await db.leaveRequest.update({ where: { id }, data: { status: "cancelled" } });
    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({ userId: auth.userId, eventKey: "leave.cancelled", details: `Cancelled leave request ${id}`, ipAddress, userAgent, module: "Leave" });
    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: false, error: "Only cancellation is supported via PATCH" }, { status: 400 });
}
