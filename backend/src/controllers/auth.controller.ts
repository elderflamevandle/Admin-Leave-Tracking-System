import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyPassword,
  hashPassword,
  hashToken,
  getRefreshTokenExpiry,
  validatePasswordStrength,
} from "../utils/auth";
import { logAudit, getClientInfo } from "../utils/audit";
import { sendPasswordResetEmail } from "../utils/email";
import { logger } from "../utils/logger";
import type { RoleName } from "../types";
import crypto from "crypto";

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

// COOKIE_SECURE=false overrides NODE_ENV so HTTP (local/dev) works without HTTPS
const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = (maxAge: number) => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required" });
      return;
    }

    const { ipAddress, userAgent } = getClientInfo(req);

    const recentAttempts = await db.loginAttempt.count({
      where: {
        email,
        attemptedAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      },
    });

    if (recentAttempts >= LOCKOUT_ATTEMPTS) {
      res.status(429).json({ success: false, error: "Account temporarily locked. Try again in 15 minutes." });
      return;
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user?.id },
      });
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user.id },
      });
      await logAudit({
        userId: user.id,
        eventKey: "auth.login_failed",
        details: "Failed login attempt",
        ipAddress,
        userAgent,
        module: "Auth",
      });
      res.status(401).json({ success: false, error: "Invalid email or password" });
      return;
    }

    const roleName = user.role.name as RoleName;
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });
    const refreshToken = await createRefreshToken({ sub: user.id }, rememberMe);

    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshTokenExpiry(rememberMe),
        ipAddress,
        userAgent,
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await db.loginAttempt.deleteMany({ where: { email } });

    await logAudit({
      userId: user.id,
      eventKey: "auth.login",
      details: `User ${user.fullName} logged in`,
      ipAddress,
      userAgent,
      module: "Auth",
    });

    logger.info("User logged in", { userId: user.id, role: roleName });

    res.cookie("accessToken", accessToken, COOKIE_OPTIONS(15 * 60));
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS(rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleName,
          permissions: user.role.permissions,
          department: user.department,
          avatarUrl: user.avatarUrl,
          forcePasswordChange: user.forcePasswordChange,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokenFromCookie = req.cookies?.accessToken;
    const tokenFromHeader = req.headers.authorization?.replace("Bearer ", "");
    const token = tokenFromCookie ?? tokenFromHeader;

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        await db.session.deleteMany({ where: { userId: payload.sub } });

        const { ipAddress, userAgent } = getClientInfo(req);
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

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ success: true });
  } catch (error) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ success: true });
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: "No refresh token" });
      return;
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const session = await db.session.findFirst({
      where: {
        userId: payload.sub,
        refreshTokenHash: tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      res.status(401).json({ success: false, error: "Session expired" });
      return;
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "User not found or inactive" });
      return;
    }

    const roleName = user.role.name as RoleName;
    const isLongSession =
      session.expiresAt.getTime() - Date.now() > 7 * 24 * 60 * 60 * 1000;

    const newAccessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });

    const newRefreshToken = await createRefreshToken({ sub: user.id }, isLongSession);
    const { ipAddress, userAgent } = getClientInfo(req);

    await db.$transaction([
      db.session.deleteMany({ where: { id: session.id } }),
      db.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newAccessToken),
          refreshTokenHash: hashToken(newRefreshToken),
          expiresAt: getRefreshTokenExpiry(isLongSession),
          ipAddress,
          userAgent,
        },
      }),
    ]);

    res.cookie("accessToken", newAccessToken, COOKIE_OPTIONS(15 * 60));
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS(isLongSession ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleName,
          permissions: user.role.permissions,
          department: user.department,
          avatarUrl: user.avatarUrl,
          forcePasswordChange: user.forcePasswordChange,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    const successMsg = { success: true, data: { message: "If this email exists, a reset link has been sent." } };

    if (!email) {
      res.json(successMsg);
      return;
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.json(successMsg);
      return;
    }

    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const resetToken = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(email, resetToken).catch((err) =>
      logger.error("Failed to send password reset email", { error: String(err) })
    );

    res.json(successMsg);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, error: "Token and password are required" });
      return;
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      res.status(400).json({ success: false, error: strengthError });
      return;
    }

    const tokenHash = hashToken(token);
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      res.status(400).json({ success: false, error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, forcePasswordChange: false },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      db.session.deleteMany({ where: { userId: resetToken.userId } }),
    ]);

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: resetToken.userId,
      eventKey: "auth.password_reset",
      details: "Password reset completed",
      ipAddress,
      userAgent,
      module: "Auth",
    });

    logger.info("Password reset completed", { userId: resetToken.userId });

    res.json({
      success: true,
      data: { message: "Password reset successful. Please log in." },
    });
  } catch (error) {
    next(error);
  }
}
