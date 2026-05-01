import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day of month

  const isAdmin = auth.role === "admin";
  const isManager = auth.role === "manager";

  let userFilter: Record<string, unknown> = { userId: auth.userId };

  if (isAdmin) {
    userFilter = {};
  } else if (isManager) {
    const managedUsers = await db.user.findMany({
      where: { managerId: auth.userId, isActive: true },
      select: { id: true },
    });
    const ids = [auth.userId, ...managedUsers.map((u) => u.id)];
    userFilter = { userId: { in: ids } };
  }

  const leaves = await db.leaveRequest.findMany({
    where: {
      ...userFilter,
      status: { in: ["approved", "pending"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: {
      user: { select: { id: true, fullName: true, department: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const holidays = await db.holiday.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: {
      leaves: leaves.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user.fullName,
        department: l.user.department,
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        workingDays: l.workingDays,
        status: l.status,
      })),
      holidays: holidays.map((h) => ({
        id: h.id,
        name: h.name,
        date: h.date.toISOString().split("T")[0],
        isRecurring: h.isRecurring,
      })),
    },
  });
}
