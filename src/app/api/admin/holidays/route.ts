import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CreateHolidaySchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().date("Invalid date"),
  isRecurring: z.boolean().default(true),
});

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const holidays = await db.holiday.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ success: true, data: holidays });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateHolidaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const holiday = await db.holiday.create({
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      isRecurring: parsed.data.isRecurring,
    },
  });

  return NextResponse.json({ success: true, data: holiday }, { status: 201 });
}
