import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = viewAll ? {} : { userId: auth.userId };
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  if (dateFrom || dateTo) {
    where.logDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const [entries, total] = await Promise.all([
    db.activityLogEntry.findMany({
      where,
      include: { user: { select: { id: true, fullName: true } } },
      skip,
      take: limit,
      orderBy: { logDate: "desc" },
    }),
    db.activityLogEntry.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: entries, meta: buildPaginationMeta(total, page, limit) });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { logDate, activities, blockers, tags } = body;

  if (!logDate || !activities) {
    return NextResponse.json({ success: false, error: "Date and activities are required" }, { status: 400 });
  }

  const existing = await db.activityLogEntry.findUnique({
    where: { userId_logDate: { userId: auth.userId, logDate: new Date(logDate) } },
  });

  if (existing) {
    if (existing.isLocked) {
      return NextResponse.json({ success: false, error: "Entry is locked and cannot be modified" }, { status: 400 });
    }
    const updated = await db.activityLogEntry.update({
      where: { id: existing.id },
      data: { activities, blockers, tags: tags ?? [] },
    });
    return NextResponse.json({ success: true, data: updated });
  }

  const entry = await db.activityLogEntry.create({
    data: { userId: auth.userId, logDate: new Date(logDate), activities, blockers, tags: tags ?? [] },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "activity.created", details: `Activity log created for ${logDate}`, ipAddress, userAgent, module: "Activity" });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
