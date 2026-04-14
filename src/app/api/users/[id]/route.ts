import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: { role: { select: { name: true, displayName: true } } },
  });

  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  const { passwordHash: _, ...safeUser } = user;
  return NextResponse.json({ success: true, data: safeUser });
}
