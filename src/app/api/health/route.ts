import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      latencyMs: Date.now() - start,
      version: process.env.npm_package_version ?? "unknown",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "error",
        error: String(err),
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
