import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const holiday = await db.holiday.findUnique({ where: { id } });
  if (!holiday) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  await db.holiday.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
