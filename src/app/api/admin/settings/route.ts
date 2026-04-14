import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const settings = await db.platformSetting.findMany({ orderBy: { key: "asc" } });
  const settingsMap = Object.fromEntries(settings.map((s: { key: string; value: unknown }) => [s.key, s.value]));

  return NextResponse.json({ success: true, data: settingsMap });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await db.platformSetting.upsert({
      where: { key },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: value as any, updatedBy: auth.userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { key, value: value as any, updatedBy: auth.userId },
    });
  }

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({ userId: auth.userId, eventKey: "settings.updated", details: `Updated settings: ${Object.keys(body).join(", ")}`, ipAddress, userAgent, module: "Admin" });

  return NextResponse.json({ success: true });
}
