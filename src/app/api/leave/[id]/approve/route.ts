import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { sendLeaveStatusEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const canApprove = auth.role === "admin" || auth.role === "manager";
  if (!canApprove) {
    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const updated = await db.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.findUnique({
        where: { id },
        select: { status: true, leaveType: true, workingDays: true, userId: true },
      });

      if (!leave) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      if (leave.status !== "pending") {
        throw Object.assign(new Error("NOT_PENDING"), { code: "NOT_PENDING" });
      }

      // Managers can only approve their direct reports' leaves
      if (auth.role === "manager") {
        const employee = await tx.user.findUnique({
          where: { id: leave.userId },
          select: { managerId: true },
        });
        if (employee?.managerId !== auth.userId) {
          throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });
        }
      }

      if (leave.leaveType === "annual") {
        const updatedUser = await tx.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { decrement: leave.workingDays } },
          select: { leaveBalance: true },
        });
        if (updatedUser.leaveBalance < 0) {
          throw Object.assign(new Error("INSUFFICIENT_BALANCE"), { code: "INSUFFICIENT_BALANCE" });
        }
      }

      return tx.leaveRequest.update({
        where: { id },
        data: { status: "approved", reviewedBy: auth.userId },
        include: { user: { select: { fullName: true, email: true } } },
      });
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({
      userId: auth.userId,
      eventKey: "leave.approved",
      details: `Approved leave request ${id}`,
      metadata: { leaveRequestId: id },
      ipAddress,
      userAgent,
      module: "Leave",
    });
    await createNotification({
      userId: updated.userId,
      title: "Leave Approved",
      message: "Your leave request has been approved.",
      link: "/leave",
    });
    await sendLeaveStatusEmail(
      updated.user.email,
      updated.user.fullName,
      "approved",
      updated.leaveType,
      updated.startDate.toISOString().split("T")[0],
      updated.endDate.toISOString().split("T")[0]
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "You can only approve your direct reports' leaves" }, { status: 403 });
    }
    if (code === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (code === "NOT_PENDING") {
      return NextResponse.json(
        { success: false, error: "Leave request is not pending" },
        { status: 400 }
      );
    }
    if (code === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Employee has insufficient leave balance" },
        { status: 400 }
      );
    }
    logger.error("Leave approval error", { error: String(err), leaveId: id });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
