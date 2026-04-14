import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import type { JWTPayload, RoleName } from "@/types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_SHORT = "7d";
const REFRESH_TOKEN_LONG = "30d";

export async function createAccessToken(payload: {
  sub: string;
  email: string;
  role: RoleName;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(
  payload: { sub: string },
  rememberMe: boolean
): Promise<string> {
  const expiry = rememberMe ? REFRESH_TOKEN_LONG : REFRESH_TOKEN_SHORT;
  return new SignJWT({ sub: payload.sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function hashToken(token: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    h = ((h << 5) - h) + char;
    h |= 0;
  }
  return h.toString(36);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return "Password must contain at least one special character";
  return null;
}

export function getRefreshTokenExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? 30 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
