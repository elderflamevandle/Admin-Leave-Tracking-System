import { Request, Response, NextFunction } from "express";
import type { PermissionKey } from "../types";

export function requirePermission(...keys: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const hasAny = keys.some((k) => user?.permissions?.includes(k));
    if (!hasAny) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Insufficient role" });
    }
    next();
  };
}
