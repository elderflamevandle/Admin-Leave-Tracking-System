import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta, calculateWorkingDays, dateRangesOverlap } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = viewAll ? {} : { userId: auth.userId };
  const statusFilter = searchParams.get("status");
  if (statusFilter) where.status = statusFilter;

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.leaveRequest.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: requests, meta: buildPaginationMeta(total, page, limit) });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leaveType, startDate, endDate, reason } = body;

  if (!leaveType || !startDate || !endDate) {
    return NextResponse.json({ success: false, error: "Leave type, start date, and end date are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start < new Date(new Date().toDateString())) {
    return NextResponse.json({ success: false, error: "Start date cannot be in the past" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 });
  }

  const existing = await db.leaveRequest.findMany({
    where: { userId: auth.userId, status: { in: ["pending", "approved"] } },
  });

  const overlap = existing.some((req) =>
    dateRangesOverlap(start, end, new Date(req.startDate), new Date(req.endDate))
  );
  if (overlap) {
    return NextResponse.json({ success: false, error: "You already have leave during these dates" }, { status: 400 });
  }

  const workingDays = calculateWorkingDays(start, end);
  const leaveRequest = await db.leaveRequest.create({
    data: { userId: auth.userId, leaveType, startDate: start, endDate: end, workingDays, reason },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "leave.submitted", details: `Leave request: ${leaveType} ${startDate}–${endDate} (${workingDays} days)`, metadata: { leaveRequestId: leaveRequest.id }, ipAddress, userAgent, module: "Leave" });

  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { fullName: true } });
  await notifyAdmins({ title: "New Leave Request", message: `${user?.fullName} requested ${leaveType} leave (${workingDays} days)`, link: "/leave/manage" });

  return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
}
