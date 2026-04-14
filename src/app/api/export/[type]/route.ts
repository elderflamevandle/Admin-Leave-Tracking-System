import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { generateCSV } from "@/lib/csv";
import { formatDateISO } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (type === "leave") {
    const isAdmin = auth.role === "admin";
    const where = {
      ...(isAdmin ? {} : { userId: auth.userId }),
      ...(from || to ? { startDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    };

    const data = await db.leaveRequest.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { startDate: "desc" },
    });

    const csv = generateCSV(
      ["Employee", "Email", "Type", "Start", "End", "Days", "Status", "Reason"],
      data.map((r) => ({
        Employee: r.user.fullName,
        Email: r.user.email,
        Type: r.leaveType,
        Start: formatDateISO(new Date(r.startDate)),
        End: formatDateISO(new Date(r.endDate)),
        Days: r.workingDays,
        Status: r.status,
        Reason: r.reason ?? "",
      }))
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leave-export.csv"`,
      },
    });
  }

  if (type === "timelog") {
    const isAdmin = auth.role === "admin";
    const where = {
      ...(isAdmin ? {} : { userId: auth.userId }),
      ...(from || to ? { logDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    };

    const data = await db.timeLogEntry.findMany({
      where,
      include: { user: { select: { fullName: true } } },
      orderBy: { logDate: "desc" },
    });

    const csv = generateCSV(
      ["Employee", "Date", "Login", "Logout", "Break (min)", "Hours Worked", "Notes"],
      data.map((r) => ({
        Employee: r.user.fullName,
        Date: formatDateISO(new Date(r.logDate)),
        Login: r.loginTime,
        Logout: r.logoutTime ?? "",
        "Break (min)": r.breakMinutes,
        "Hours Worked": r.hoursWorked?.toString() ?? "",
        Notes: r.notes ?? "",
      }))
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timelog-export.csv"`,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Unknown export type" }, { status: 400 });
}
