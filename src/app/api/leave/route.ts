import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta, calculateWorkingDays } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";
import { rateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CreateLeaveSchema = z.object({
  leaveType: z.enum(["annual", "sick", "personal", "other"]),
  startDate: z.string().date("Invalid start date"),
  endDate: z.string().date("Invalid end date"),
  reason: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";
  const isManager = auth.role === "manager";

  let where: Record<string, unknown> = { userId: auth.userId };
  if (viewAll) {
    where = {};
  } else if (isManager && searchParams.get("team") === "true") {
    const managedUsers = await db.user.findMany({
      where: { managerId: auth.userId, isActive: true },
      select: { id: true },
    });
    const ids = [auth.userId, ...managedUsers.map((u: { id: string }) => u.id)];
    where = { userId: { in: ids } };
  }

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

  return NextResponse.json({
    success: true,
    data: requests,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  if (!rateLimits.leave(auth.userId)) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { leaveType, startDate, endDate, reason } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start < new Date(new Date().toDateString())) {
    return NextResponse.json(
      { success: false, error: "Start date cannot be in the past" },
      { status: 400 }
    );
  }
  if (end < start) {
    return NextResponse.json(
      { success: false, error: "End date must be on or after start date" },
      { status: 400 }
    );
  }

  // DB-level overlap check — avoids loading all records into memory
  const overlap = await db.leaveRequest.findFirst({
    where: {
      userId: auth.userId,
      status: { in: ["pending", "approved"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlap) {
    return NextResponse.json(
      { success: false, error: "You already have leave during these dates" },
      { status: 400 }
    );
  }

  const holidays = await db.holiday.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true },
  });
  const workingDays = calculateWorkingDays(start, end, holidays.map((h) => h.date));
  const leaveRequest = await db.leaveRequest.create({
    data: { userId: auth.userId, leaveType, startDate: start, endDate: end, workingDays, reason },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "leave.submitted",
    details: `Leave request: ${leaveType} ${startDate}–${endDate} (${workingDays} days)`,
    metadata: { leaveRequestId: leaveRequest.id },
    ipAddress,
    userAgent,
    module: "Leave",
  });

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { fullName: true },
  });
  await notifyAdmins({
    title: "New Leave Request",
    message: `${user?.fullName} requested ${leaveType} leave (${workingDays} days)`,
    link: "/leave/manage",
  });

  return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
}
