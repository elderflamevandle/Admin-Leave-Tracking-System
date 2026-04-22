import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        await db.session.deleteMany({ where: { userId: payload.sub } });

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAudit({
          userId: payload.sub,
          eventKey: "auth.logout",
          details: "User logged out",
          ipAddress,
          userAgent,
          module: "Auth",
        });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("refreshToken");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete("refreshToken");
    return response;
  }
}
