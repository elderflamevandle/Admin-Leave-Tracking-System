import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const roles = await db.role.findMany({
    select: { id: true, name: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json({ success: true, data: roles });
}