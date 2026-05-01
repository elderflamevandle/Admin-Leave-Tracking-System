import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Read token from cookie (new flow) or Authorization header (legacy clients)
    const tokenFromCookie = request.cookies.get("accessToken")?.value;
    const tokenFromHeader = request.headers.get("authorization")?.replace("Bearer ", "");
    const token = tokenFromCookie ?? tokenFromHeader;

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

        logger.info("User logged out", { userId: payload.sub });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  } catch (error) {
    logger.error("Logout error", { error: String(error) });
    const response = NextResponse.json({ success: true });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}
