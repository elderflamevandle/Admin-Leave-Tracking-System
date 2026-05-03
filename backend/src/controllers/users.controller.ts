import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../utils/auth";
import { logAudit, getClientInfo } from "../utils/audit";
import { parsePagination, buildPaginationMeta } from "../utils/utils";

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const search = String(req.query.search ?? "");
    const roleFilter = String(req.query.role ?? "");
    const departmentFilter = String(req.query.department ?? "");
    const statusFilter = String(req.query.status ?? "");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter) where.role = { name: roleFilter };
    if (departmentFilter) where.department = departmentFilter;
    if (statusFilter === "active") where.isActive = true;
    if (statusFilter === "inactive") where.isActive = false;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: { role: { select: { name: true, displayName: true } } },
        skip,
        take: limit,
        orderBy: { fullName: "asc" },
      }),
      db.user.count({ where }),
    ]);

    const safeUsers = users.map(({ passwordHash: _pw, ...u }) => u);

    res.json({
      success: true,
      data: safeUsers,
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      include: { role: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
}

export async function patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { fullName, department, currentPassword, newPassword } = req.body;

    if (currentPassword && newPassword) {
      const user = await db.user.findUnique({ where: { id: auth.userId } });
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ success: false, error: "Current password is incorrect" });
        return;
      }

      const strengthError = validatePasswordStrength(newPassword);
      if (strengthError) {
        res.status(400).json({ success: false, error: strengthError });
        return;
      }

      await db.user.update({
        where: { id: auth.userId },
        data: { passwordHash: await hashPassword(newPassword), forcePasswordChange: false },
      });
      await db.session.deleteMany({ where: { userId: auth.userId } });

      const { ipAddress, userAgent } = getClientInfo(req);
      await logAudit({
        userId: auth.userId,
        eventKey: "auth.password_reset",
        details: "User changed their password",
        ipAddress,
        userAgent,
        module: "Auth",
      });

      res.json({ success: true, data: { message: "Password changed" } });
      return;
    }

    const updated = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(fullName && { fullName }),
        ...(department !== undefined && { department }),
      },
    });
    const { passwordHash: _, ...safeUser } = updated;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await db.user.findUnique({
      where: { id },
      include: { role: { select: { name: true, displayName: true } } },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
}
