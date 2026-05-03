import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { logAudit, getClientInfo } from "../utils/audit";
import { parsePagination, buildPaginationMeta } from "../utils/utils";

export async function getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const viewAll = req.query.all === "true" && auth.role === "admin";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = viewAll ? {} : { userId: auth.userId };
    const dateFrom = String(req.query.from ?? "");
    const dateTo = String(req.query.to ?? "");
    if (dateFrom || dateTo) {
      where.logDate = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [entries, total] = await Promise.all([
      db.activityLogEntry.findMany({
        where,
        include: { user: { select: { id: true, fullName: true } } },
        skip,
        take: limit,
        orderBy: { logDate: "desc" },
      }),
      db.activityLogEntry.count({ where }),
    ]);

    res.json({ success: true, data: entries, meta: buildPaginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
}

export async function createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { logDate, activities, blockers, tags } = req.body;

    if (!logDate || !activities) {
      res.status(400).json({ success: false, error: "Date and activities are required" });
      return;
    }

    const existing = await db.activityLogEntry.findUnique({
      where: { userId_logDate: { userId: auth.userId, logDate: new Date(logDate) } },
    });

    if (existing) {
      if (existing.isLocked) {
        res.status(400).json({ success: false, error: "Entry is locked and cannot be modified" });
        return;
      }
      const updated = await db.activityLogEntry.update({
        where: { id: existing.id },
        data: { activities, blockers, tags: tags ?? [] },
      });
      res.json({ success: true, data: updated });
      return;
    }

    const entry = await db.activityLogEntry.create({
      data: { userId: auth.userId, logDate: new Date(logDate), activities, blockers, tags: tags ?? [] },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "activity.created",
      details: `Activity log created for ${logDate}`,
      ipAddress,
      userAgent,
      module: "Activity",
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
}

export async function patchActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;
    const entry = await db.activityLogEntry.findUnique({ where: { id } });
    if (!entry) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    if (entry.userId !== auth.userId && auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }
    if (entry.isLocked) {
      res.status(400).json({ success: false, error: "Entry is locked" });
      return;
    }

    const body = req.body;
    const updated = await db.activityLogEntry.update({
      where: { id },
      data: {
        ...(body.activities && { activities: body.activities }),
        ...(body.blockers !== undefined && { blockers: body.blockers }),
        ...(body.tags && { tags: body.tags }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
