import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export async function POST() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await db.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
