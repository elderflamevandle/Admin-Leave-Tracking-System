import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { rateLimits } from "../utils/rate-limit";

export async function exportTimelogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    if (!await rateLimits.export(auth.userId)) {
      res.status(429).json({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const isAdmin = auth.role === "admin";
    const userId = isAdmin ? (String(req.query.userId ?? "") || auth.userId) : auth.userId;
    const dateFrom = String(req.query.from ?? "");
    const dateTo = String(req.query.to ?? "");

    const where: Record<string, unknown> = { userId };
    if (dateFrom || dateTo) {
      where.logDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const entries = await db.timeLogEntry.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { logDate: "asc" },
    });

    const rows = entries.map((e) => ({
      date: e.logDate.toISOString().split("T")[0],
      name: e.user.fullName,
      email: e.user.email,
      loginTime: e.loginTime,
      logoutTime: e.logoutTime ?? "",
      breakMinutes: e.breakMinutes,
      hoursWorked: e.hoursWorked?.toString() ?? "",
      notes: e.notes ?? "",
    }));

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function exportLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    if (!await rateLimits.export(auth.userId)) {
      res.status(429).json({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const isAdmin = auth.role === "admin";
    const dateFrom = String(req.query.from ?? "");
    const dateTo = String(req.query.to ?? "");

    const where: Record<string, unknown> = isAdmin ? {} : { userId: auth.userId };
    if (dateFrom || dateTo) {
      where.startDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const leaves = await db.leaveRequest.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { startDate: "asc" },
    });

    const rows = leaves.map((l) => ({
      name: l.user.fullName,
      email: l.user.email,
      leaveType: l.leaveType,
      startDate: l.startDate.toISOString().split("T")[0],
      endDate: l.endDate.toISOString().split("T")[0],
      workingDays: l.workingDays,
      status: l.status,
      reason: l.reason ?? "",
    }));

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}
