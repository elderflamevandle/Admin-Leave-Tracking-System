import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { verifyAccessToken } from "../utils/auth";
import type { RoleName, PermissionKey } from "../types";

export interface AuthUser {
  userId: string;
  email: string;
  role: RoleName;
  permissions: PermissionKey[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }

    // Load role + permissions from DB to ensure they're always up-to-date
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "User not found or inactive" });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role.name as RoleName,
      permissions: (user.role.permissions as PermissionKey[]) ?? [],
    };

    next();
  } catch (error) {
    next(error);
  }
}
