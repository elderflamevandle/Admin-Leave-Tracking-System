import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta, calculateHoursWorked } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";
import { rateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format");

const CreateTimelogSchema = z.object({
  logDate: z.string().date("Invalid log date"),
  loginTime: TimeSchema,
  logoutTime: TimeSchema.optional(),
  breakMinutes: z.number().int().min(0).max(480).default(0),
  notes: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";
  const userId = viewAll ? (searchParams.get("userId") ?? undefined) : auth.userId;

  const where: Record<string, unknown> = userId ? { userId } : {};
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  if (dateFrom || dateTo) {
    where.logDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const [entries, total] = await Promise.all([
    db.timeLogEntry.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true } },
        amender: { select: { id: true, fullName: true } },
      },
      skip,
      take: limit,
      orderBy: { logDate: "desc" },
    }),
    db.timeLogEntry.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: entries,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  if (!rateLimits.timelog(auth.userId)) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateTimelogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { logDate, loginTime, logoutTime, breakMinutes, notes } = parsed.data;

  const existing = await db.timeLogEntry.findUnique({
    where: { userId_logDate: { userId: auth.userId, logDate: new Date(logDate) } },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Entry already exists for this date" },
      { status: 400 }
    );
  }

  const hoursWorked = logoutTime
    ? calculateHoursWorked(loginTime, logoutTime, breakMinutes)
    : null;

  const entry = await db.timeLogEntry.create({
    data: {
      userId: auth.userId,
      logDate: new Date(logDate),
      loginTime,
      logoutTime,
      breakMinutes,
      hoursWorked,
      notes,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "timelog.created",
    details: `Time log created for ${logDate}`,
    metadata: { timeLogId: entry.id },
    ipAddress,
    userAgent,
    module: "Time",
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
