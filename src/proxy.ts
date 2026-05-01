import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import type { RoleName } from "@/types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
];

const ADMIN_API_PREFIX = "/api/admin";

// In Next.js 16, Middleware was renamed to Proxy.
// Named export "proxy" (or default export) in proxy.ts is the convention.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  // Non-API pages: gate on the presence of the refresh cookie only (fast check)
  if (!isApi) {
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // API routes: require a valid access token from HttpOnly cookie or Authorization header
  const tokenFromCookie = request.cookies.get("accessToken")?.value;
  const tokenFromHeader = request.headers.get("authorization")?.replace("Bearer ", "");
  const token = tokenFromCookie ?? tokenFromHeader;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as RoleName;

    if (pathname.startsWith(ADMIN_API_PREFIX) && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Forward verified identity + role-based permissions to route handlers
    const permissions = ROLE_PERMISSIONS[role] ?? [];
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("x-user-permissions", JSON.stringify(permissions));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
