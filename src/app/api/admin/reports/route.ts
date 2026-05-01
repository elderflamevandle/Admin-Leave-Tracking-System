import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || (auth.role !== "admin" && auth.role !== "manager")) {
    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // Leave utilization by department
  const leaveByDept = await db.leaveRequest.groupBy({
    by: ["userId"],
    where: {
      status: "approved",
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd },
    },
    _sum: { workingDays: true },
  });

  const userIds = leaveByDept.map((r) => r.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, department: true },
  });
  const userDeptMap: Record<string, string> = {};
  for (const u of users) userDeptMap[u.id] = u.department ?? "Unknown";

  const deptMap: Record<string, number> = {};
  for (const row of leaveByDept) {
    const dept = userDeptMap[row.userId] ?? "Unknown";
    deptMap[dept] = (deptMap[dept] ?? 0) + (row._sum.workingDays ?? 0);
  }
  const leaveByDepartment = Object.entries(deptMap).map(([department, days]) => ({
    department,
    days,
  }));

  // Leave type breakdown
  const leaveByType = await db.leaveRequest.groupBy({
    by: ["leaveType"],
    where: {
      status: "approved",
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd },
    },
    _count: { id: true },
    _sum: { workingDays: true },
  });

  // Monthly leave count (pending + approved)
  const allLeaves = await db.leaveRequest.findMany({
    where: {
      status: { in: ["approved", "pending"] },
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd },
    },
    select: { startDate: true, workingDays: true, status: true },
  });

  const monthlyMap: Record<string, { approved: number; pending: number }> = {};
  for (let m = 0; m < 12; m++) {
    monthlyMap[String(m)] = { approved: 0, pending: 0 };
  }
  for (const l of allLeaves) {
    const month = new Date(l.startDate).getMonth();
    if (l.status === "approved") monthlyMap[String(month)].approved += l.workingDays;
    else monthlyMap[String(month)].pending += l.workingDays;
  }
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const leaveByMonth = monthLabels.map((month, i) => ({
    month,
    approved: monthlyMap[String(i)].approved,
    pending: monthlyMap[String(i)].pending,
  }));

  // Overtime: days where hoursWorked > 8
  const timeLogs = await db.timeLogEntry.findMany({
    where: {
      logDate: { gte: yearStart, lte: yearEnd },
      hoursWorked: { not: null },
    },
    select: { logDate: true, hoursWorked: true, userId: true },
  });

  const overtimeByMonth: Record<string, number> = {};
  for (let m = 0; m < 12; m++) overtimeByMonth[String(m)] = 0;
  for (const log of timeLogs) {
    if (Number(log.hoursWorked) > 8) {
      const month = new Date(log.logDate).getMonth();
      overtimeByMonth[String(month)]++;
    }
  }
  const overtimeByMonthData = monthLabels.map((month, i) => ({
    month,
    overtimeDays: overtimeByMonth[String(i)],
  }));

  // Summary stats
  const [totalEmployees, pendingLeaves, totalApprovedDays] = await Promise.all([
    db.user.count({ where: { isActive: true } }),
    db.leaveRequest.count({ where: { status: "pending" } }),
    db.leaveRequest.aggregate({
      where: { status: "approved", startDate: { gte: yearStart }, endDate: { lte: yearEnd } },
      _sum: { workingDays: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      year,
      summary: {
        totalEmployees,
        pendingLeaves,
        totalApprovedDays: totalApprovedDays._sum.workingDays ?? 0,
      },
      leaveByDepartment,
      leaveByType: leaveByType.map((r) => ({
        type: r.leaveType,
        count: r._count.id,
        days: r._sum.workingDays ?? 0,
      })),
      leaveByMonth,
      overtimeByMonth: overtimeByMonthData,
    },
  });
}
