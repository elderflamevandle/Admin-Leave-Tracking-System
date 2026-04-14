import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { calculateHoursWorked } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await db.timeLogEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const isOwner = entry.userId === auth.userId;
  const isAdmin = auth.role === "admin";

  if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  if (isOwner && !isAdmin) {
    const daysSince = Math.floor((Date.now() - new Date(entry.logDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) {
      return NextResponse.json({ success: false, error: "Entries older than 7 days can only be edited by admin" }, { status: 403 });
    }
  }

  const body = await request.json();
  const { loginTime, logoutTime, breakMinutes, notes, amendmentNote } = body;

  const newLogin = loginTime ?? entry.loginTime;
  const newLogout = logoutTime ?? entry.logoutTime;
  const newBreak = breakMinutes ?? entry.breakMinutes;
  const hoursWorked = newLogout ? calculateHoursWorked(newLogin, newLogout, newBreak) : entry.hoursWorked;

  const updated = await db.timeLogEntry.update({
    where: { id },
    data: {
      loginTime: newLogin,
      logoutTime: newLogout,
      breakMinutes: newBreak,
      hoursWorked,
      notes: notes ?? entry.notes,
      ...(isAdmin && !isOwner && {
        isAmended: true,
        amendedBy: auth.userId,
        amendmentNote: amendmentNote ?? "Amended by admin",
      }),
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "timelog.updated", details: `Time log ${id} updated`, ipAddress, userAgent, module: "Time" });

  return NextResponse.json({ success: true, data: updated });
}
