import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await db.activityLogEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (entry.userId !== auth.userId && auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (entry.isLocked) {
    return NextResponse.json({ success: false, error: "Entry is locked" }, { status: 400 });
  }

  const body = await request.json();
  const updated = await db.activityLogEntry.update({
    where: { id },
    data: {
      ...(body.activities && { activities: body.activities }),
      ...(body.blockers !== undefined && { blockers: body.blockers }),
      ...(body.tags && { tags: body.tags }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
