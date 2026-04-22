import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const moduleParam = searchParams.get("module");
  const eventKey = searchParams.get("eventKey");
  const userId = searchParams.get("userId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (moduleParam) where.module = moduleParam;
  if (eventKey) where.eventKey = { contains: eventKey };
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
}
