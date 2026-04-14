import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({ where: { userId: auth.userId, isRead: false } }),
  ]);

  return NextResponse.json({ success: true, data: { notifications, unreadCount } });
}
