import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { calculateHoursWorked } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:mm");

const RowSchema = z.object({
  date: z.string().date("Invalid date"),
  loginTime: TimeSchema,
  logoutTime: TimeSchema.optional().or(z.literal("")),
  breakMinutes: z.coerce.number().int().min(0).max(480).default(0),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.rows)) {
    return NextResponse.json({ success: false, error: "Expected { rows: [...] }" }, { status: 400 });
  }

  const results: { row: number; status: "ok" | "error"; error?: string }[] = [];
  let imported = 0;

  for (let i = 0; i < body.rows.length; i++) {
    const parsed = RowSchema.safeParse(body.rows[i]);
    if (!parsed.success) {
      results.push({ row: i + 1, status: "error", error: parsed.error.issues[0]?.message });
      continue;
    }

    const { date, loginTime, logoutTime, breakMinutes, notes } = parsed.data;
    const logDate = new Date(date);
    const logout = logoutTime && logoutTime !== "" ? logoutTime : undefined;
    const hoursWorked =
      logout ? calculateHoursWorked(loginTime, logout, breakMinutes) : null;

    try {
      await db.timeLogEntry.upsert({
        where: { userId_logDate: { userId: auth.userId, logDate } },
        update: { loginTime, logoutTime: logout ?? null, breakMinutes, hoursWorked, notes: notes ?? null },
        create: { userId: auth.userId, logDate, loginTime, logoutTime: logout ?? null, breakMinutes, hoursWorked, notes: notes ?? null },
      });
      results.push({ row: i + 1, status: "ok" });
      imported++;
    } catch {
      results.push({ row: i + 1, status: "error", error: "Failed to save entry" });
    }
  }

  return NextResponse.json({ success: true, data: { imported, total: body.rows.length, results } });
}
