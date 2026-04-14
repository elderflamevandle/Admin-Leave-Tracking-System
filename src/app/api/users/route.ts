import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const search = searchParams.get("search") ?? "";
  const roleFilter = searchParams.get("role") ?? "";
  const departmentFilter = searchParams.get("department") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (roleFilter) where.role = { name: roleFilter };
  if (departmentFilter) where.department = departmentFilter;
  if (statusFilter === "active") where.isActive = true;
  if (statusFilter === "inactive") where.isActive = false;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { role: { select: { name: true, displayName: true } } },
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
    }),
    db.user.count({ where }),
  ]);

  const safeUsers = users.map(({ passwordHash: _, ...u }) => u);

  return NextResponse.json({
    success: true,
    data: safeUsers,
    meta: buildPaginationMeta(total, page, limit),
  });
}
