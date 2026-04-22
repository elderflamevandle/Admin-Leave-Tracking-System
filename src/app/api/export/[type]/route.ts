import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { generateCSV } from "@/lib/csv";
import { formatDateISO } from "@/lib/utils";

export const dynamic = 'force-dynamic';

type CsvRow = Record<string, string | number>;

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
  const isAdmin = auth.role === "admin";

  if (type === "leave") {
    const where = {
      ...(isAdmin ? {} : { userId: auth.userId }),
      ...(from || to ? { startDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    };

    const data = await db.leaveRequest.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { startDate: "desc" },
    });

    const headers = ["Employee", "Email", "Type", "Start", "End", "Days", "Status", "Reason"];
    const rows: CsvRow[] = data.map((r: typeof data[0]) => ({
      Employee: r.user.fullName,
      Email: r.user.email,
      Type: r.leaveType,
      Start: formatDateISO(new Date(r.startDate)),
      End: formatDateISO(new Date(r.endDate)),
      Days: r.workingDays,
      Status: r.status,
      Reason: r.reason ?? "",
    }));

    return new NextResponse(generateCSV(headers, rows as Record<string, unknown>[]), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leave-export.csv"`,
      },
    });
  }

  if (type === "timelog") {
    const where = {
      ...(isAdmin ? {} : { userId: auth.userId }),
      ...(from || to ? { logDate: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } } : {}),
    };

    const data = await db.timeLogEntry.findMany({
      where,
      include: { user: { select: { fullName: true } } },
      orderBy: { logDate: "desc" },
    });

    const headers = ["Employee", "Date", "Login", "Logout", "Break (min)", "Hours Worked", "Notes"];
    const rows: CsvRow[] = data.map((r: typeof data[0]) => ({
      Employee: r.user.fullName,
      Date: formatDateISO(new Date(r.logDate)),
      Login: r.loginTime,
      Logout: r.logoutTime ?? "",
      "Break (min)": r.breakMinutes,
      "Hours Worked": r.hoursWorked?.toString() ?? "",
      Notes: r.notes ?? "",
    }));

    return new NextResponse(generateCSV(headers, rows as Record<string, unknown>[]), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timelog-export.csv"`,
      },
    });
  }

  return NextResponse.json({ success: false, error: "Unknown export type" }, { status: 400 });
}
