import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { logAudit, getClientInfo } from "../utils/audit";
import { rateLimits } from "../utils/rate-limit";
import { parsePagination, buildPaginationMeta, calculateHoursWorked } from "../utils/utils";

const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format");

const CreateTimelogSchema = z.object({
  logDate: z.string().date("Invalid log date"),
  loginTime: TimeSchema,
  logoutTime: TimeSchema.optional(),
  breakMinutes: z.number().int().min(0).max(480).default(0),
  notes: z.string().max(1000).optional(),
});

const RowSchema = z.object({
  date: z.string().date("Invalid date"),
  loginTime: TimeSchema,
  logoutTime: TimeSchema.optional().or(z.literal("")),
  breakMinutes: z.coerce.number().int().min(0).max(480).default(0),
  notes: z.string().max(1000).optional(),
});

export async function getTimelogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const viewAll = req.query.all === "true" && auth.role === "admin";
    const userId = viewAll ? (String(req.query.userId ?? "") || undefined) : auth.userId;

    const where: Record<string, unknown> = userId ? { userId } : {};
    const dateFrom = String(req.query.from ?? "");
    const dateTo = String(req.query.to ?? "");
    if (dateFrom || dateTo) {
      where.logDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [entries, total] = await Promise.all([
      db.timeLogEntry.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true } },
          amender: { select: { id: true, fullName: true } },
        },
        skip,
        take: limit,
        orderBy: { logDate: "desc" },
      }),
      db.timeLogEntry.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries,
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function createTimelog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    if (!await rateLimits.timelog(auth.userId)) {
      res.status(429).json({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const parsed = CreateTimelogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { logDate, loginTime, logoutTime, breakMinutes, notes } = parsed.data;

    const todayISO = new Date().toISOString().slice(0, 10);
    const nowHHmm = new Date().toISOString().slice(11, 16);
    if (logDate > todayISO) {
      res.status(400).json({ success: false, error: "Cannot log time for a future date. Contact your manager for approval." });
      return;
    }
    if (logDate === todayISO) {
      if (loginTime > nowHHmm) {
        res.status(400).json({ success: false, error: "Login time cannot be in the future. Contact your manager for approval." });
        return;
      }
      if (logoutTime && logoutTime > nowHHmm) {
        res.status(400).json({ success: false, error: "Logout time cannot be in the future. Contact your manager for approval." });
        return;
      }
    }

    const existing = await db.timeLogEntry.findUnique({
      where: { userId_logDate: { userId: auth.userId, logDate: new Date(logDate) } },
    });
    if (existing) {
      res.status(400).json({ success: false, error: "Entry already exists for this date" });
      return;
    }

    const hoursWorked = logoutTime
      ? calculateHoursWorked(loginTime, logoutTime, breakMinutes)
      : null;

    const entry = await db.timeLogEntry.create({
      data: {
        userId: auth.userId,
        logDate: new Date(logDate),
        loginTime,
        logoutTime,
        breakMinutes,
        hoursWorked,
        notes,
      },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "timelog.created",
      details: `Time log created for ${logDate}`,
      metadata: { timeLogId: entry.id },
      ipAddress,
      userAgent,
      module: "Time",
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

export async function patchTimelog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;
    const entry = await db.timeLogEntry.findUnique({ where: { id } });
    if (!entry) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    const isOwner = entry.userId === auth.userId;
    const isAdmin = auth.role === "admin";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }

    if (isOwner && !isAdmin) {
      const daysSince = Math.floor((Date.now() - new Date(entry.logDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) {
        res.status(403).json({ success: false, error: "Entries older than 7 days can only be edited by admin" });
        return;
      }
    }

    const { loginTime, logoutTime, breakMinutes, notes, amendmentNote } = req.body;

    const newLogin = loginTime ?? entry.loginTime;
    const newLogout = logoutTime ?? entry.logoutTime;
    const newBreak = breakMinutes ?? entry.breakMinutes;
    const hoursWorked = newLogout ? calculateHoursWorked(newLogin, newLogout, newBreak) : entry.hoursWorked;

    const updated = await db.timeLogEntry.update({
      where: { id },
      data: {
        loginTime: newLogin,
        logoutTime: newLogout,
        breakMinutes: newBreak,
        hoursWorked,
        notes: notes ?? entry.notes,
        ...(isAdmin && !isOwner && {
          isAmended: true,
          amendedBy: auth.userId,
          amendmentNote: amendmentNote ?? "Amended by admin",
        }),
      },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "timelog.updated",
      details: `Time log ${id} updated`,
      ipAddress,
      userAgent,
      module: "Time",
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function importTimelogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const body = req.body;

    if (!Array.isArray(body?.rows)) {
      res.status(400).json({ success: false, error: "Expected { rows: [...] }" });
      return;
    }

    const results: { row: number; status: "ok" | "error"; error?: string }[] = [];
    let imported = 0;

    for (let i = 0; i < body.rows.length; i++) {
      const parsed = RowSchema.safeParse(body.rows[i]);
      if (!parsed.success) {
        results.push({ row: i + 1, status: "error", error: parsed.error.issues[0]?.message });
        continue;
      }

      const { date, loginTime, logoutTime, breakMinutes, notes } = parsed.data;
      const logDate = new Date(date);
      const logout = logoutTime && logoutTime !== "" ? logoutTime : undefined;
      const hoursWorked = logout ? calculateHoursWorked(loginTime, logout, breakMinutes) : null;

      try {
        await db.timeLogEntry.upsert({
          where: { userId_logDate: { userId: auth.userId, logDate } },
          update: { loginTime, logoutTime: logout ?? null, breakMinutes, hoursWorked, notes: notes ?? null },
          create: { userId: auth.userId, logDate, loginTime, logoutTime: logout ?? null, breakMinutes, hoursWorked, notes: notes ?? null },
        });
        results.push({ row: i + 1, status: "ok" });
        imported++;
      } catch {
        results.push({ row: i + 1, status: "error", error: "Failed to save entry" });
      }
    }

    res.json({ success: true, data: { imported, total: body.rows.length, results } });
  } catch (error) {
    next(error);
  }
}
