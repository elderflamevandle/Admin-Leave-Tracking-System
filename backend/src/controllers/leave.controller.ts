import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { logAudit, getClientInfo } from "../utils/audit";
import { notifyAdmins, createNotification } from "../utils/notifications";
import { sendLeaveStatusEmail } from "../utils/email";
import { rateLimits } from "../utils/rate-limit";
import { parsePagination, buildPaginationMeta, calculateWorkingDays } from "../utils/utils";
import { logger } from "../utils/logger";
import type { PermissionKey } from "../types";

const CreateLeaveSchema = z.object({
  leaveType: z.enum(["annual", "sick", "personal", "other"]),
  startDate: z.string().date("Invalid start date"),
  endDate: z.string().date("Invalid end date"),
  reason: z.string().max(500).optional(),
});

function hasPermission(permissions: string[], key: PermissionKey): boolean {
  return permissions.includes(key);
}

export async function getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const viewAll = req.query.all === "true" && auth.role === "admin";
    const isManager = auth.role === "manager";

    let where: Record<string, unknown> = { userId: auth.userId };
    if (viewAll) {
      where = {};
    } else if (isManager && req.query.team === "true") {
      const managedUsers = await db.user.findMany({
        where: { managerId: auth.userId, isActive: true },
        select: { id: true },
      });
      const ids = [auth.userId, ...managedUsers.map((u: { id: string }) => u.id)];
      where = { userId: { in: ids } };
    }

    const statusFilter = String(req.query.status ?? "");
    if (statusFilter) where.status = statusFilter;

    const [requests, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.leaveRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: requests,
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function createLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    if (!await rateLimits.leave(auth.userId)) {
      res.status(429).json({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const parsed = CreateLeaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { leaveType, startDate, endDate, reason } = parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < new Date(new Date().toDateString())) {
      res.status(400).json({ success: false, error: "Start date cannot be in the past" });
      return;
    }
    if (end < start) {
      res.status(400).json({ success: false, error: "End date must be on or after start date" });
      return;
    }

    const overlap = await db.leaveRequest.findFirst({
      where: {
        userId: auth.userId,
        status: { in: ["pending", "approved"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) {
      res.status(400).json({ success: false, error: "You already have leave during these dates" });
      return;
    }

    const holidays = await db.holiday.findMany({
      where: { date: { gte: start, lte: end } },
      select: { date: true },
    });
    const workingDays = calculateWorkingDays(start, end, holidays.map((h) => h.date));
    const leaveRequest = await db.leaveRequest.create({
      data: { userId: auth.userId, leaveType, startDate: start, endDate: end, workingDays, reason },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "leave.submitted",
      details: `Leave request: ${leaveType} ${startDate}–${endDate} (${workingDays} days)`,
      metadata: { leaveRequestId: leaveRequest.id },
      ipAddress,
      userAgent,
      module: "Leave",
    });

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { fullName: true },
    });
    await notifyAdmins({
      title: "New Leave Request",
      message: `${user?.fullName} requested ${leaveType} leave (${workingDays} days)`,
      link: "/leave/manage",
    });

    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;
    const leave = await db.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
    });

    if (!leave) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    if (leave.userId !== auth.userId && auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }

    res.json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
}

export async function patchLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;
    const leave = await db.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    if (leave.userId !== auth.userId) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }
    if (leave.status !== "pending") {
      res.status(400).json({ success: false, error: "Only pending requests can be cancelled" });
      return;
    }

    if (req.body.status === "cancelled") {
      const updated = await db.leaveRequest.update({ where: { id }, data: { status: "cancelled" } });
      const { ipAddress, userAgent } = getClientInfo(req);
      await logAudit({
        userId: auth.userId,
        eventKey: "leave.cancelled",
        details: `Cancelled leave request ${id}`,
        ipAddress,
        userAgent,
        module: "Leave",
      });
      res.json({ success: true, data: updated });
      return;
    }

    res.status(400).json({ success: false, error: "Only cancellation is supported via PATCH" });
  } catch (error) {
    next(error);
  }
}

export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;

    const canApprove =
      hasPermission(auth.permissions, "leave.approve_all") ||
      hasPermission(auth.permissions, "leave.approve_team");
    if (!canApprove) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }

    const updated = await db.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.findUnique({
        where: { id },
        select: { status: true, leaveType: true, workingDays: true, userId: true },
      });

      if (!leave) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      if (leave.status !== "pending") {
        throw Object.assign(new Error("NOT_PENDING"), { code: "NOT_PENDING" });
      }

      if (auth.role === "manager") {
        const employee = await tx.user.findUnique({
          where: { id: leave.userId },
          select: { managerId: true },
        });
        if (employee?.managerId !== auth.userId) {
          throw Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" });
        }
      }

      if (leave.leaveType === "annual") {
        const locked = await tx.$queryRaw<[{ leave_balance: number }]>`
          SELECT leave_balance FROM users WHERE id = ${leave.userId}::uuid FOR UPDATE
        `;
        const currentBalance = locked[0]?.leave_balance ?? 0;

        if (currentBalance < leave.workingDays) {
          throw Object.assign(new Error("INSUFFICIENT_BALANCE"), { code: "INSUFFICIENT_BALANCE" });
        }

        await tx.user.update({
          where: { id: leave.userId },
          data: { leaveBalance: { decrement: leave.workingDays } },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: { status: "approved", reviewedBy: auth.userId },
        include: { user: { select: { fullName: true, email: true } } },
      });
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "leave.approved",
      details: `Approved leave request ${id}`,
      metadata: { leaveRequestId: id },
      ipAddress,
      userAgent,
      module: "Leave",
    });
    await createNotification({
      userId: updated.userId,
      title: "Leave Approved",
      message: "Your leave request has been approved.",
      link: "/leave",
    });

    sendLeaveStatusEmail(
      updated.user.email,
      updated.user.fullName,
      "approved",
      updated.leaveType,
      updated.startDate.toISOString().split("T")[0],
      updated.endDate.toISOString().split("T")[0]
    ).catch((err) => logger.error("Leave approval email failed", { error: String(err) }));

    res.json({ success: true, data: updated });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "FORBIDDEN") {
      res.status(403).json({ success: false, error: "You can only approve your direct reports' leaves" });
      return;
    }
    if (code === "NOT_FOUND") {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    if (code === "NOT_PENDING") {
      res.status(400).json({ success: false, error: "Leave request is not pending" });
      return;
    }
    if (code === "INSUFFICIENT_BALANCE") {
      res.status(400).json({ success: false, error: "Employee has insufficient leave balance" });
      return;
    }
    next(err);
  }
}

export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const { id } = req.params;

    const canReject = auth.role === "admin" || auth.role === "manager";
    if (!canReject) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const { note } = req.body;
    if (!note) {
      res.status(400).json({ success: false, error: "Rejection note is required" });
      return;
    }

    const leave = await db.leaveRequest.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, email: true, managerId: true } } },
    });
    if (!leave) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }
    if (leave.status !== "pending") {
      res.status(400).json({ success: false, error: "Leave request is not pending" });
      return;
    }

    if (auth.role === "manager" && leave.user.managerId !== auth.userId) {
      res.status(403).json({ success: false, error: "You can only reject your direct reports' leaves" });
      return;
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: { status: "rejected", reviewedBy: auth.userId, reviewerNote: note },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "leave.rejected",
      details: `Rejected leave request ${id}: ${note}`,
      metadata: { leaveRequestId: id },
      ipAddress,
      userAgent,
      module: "Leave",
    });
    await createNotification({
      userId: leave.userId,
      title: "Leave Rejected",
      message: `Your leave request was rejected: ${note}`,
      link: "/leave",
    });
    await sendLeaveStatusEmail(
      leave.user.email,
      leave.user.fullName,
      "rejected",
      leave.leaveType,
      leave.startDate.toISOString().split("T")[0],
      leave.endDate.toISOString().split("T")[0],
      note
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    const monthParam = String(req.query.month ?? ""); // YYYY-MM
    const now = new Date();
    const [year, month] = monthParam
      ? monthParam.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const isAdminRole = auth.role === "admin";
    const isManagerRole = auth.role === "manager";

    let userFilter: Record<string, unknown> = { userId: auth.userId };
    if (isAdminRole) {
      userFilter = {};
    } else if (isManagerRole) {
      const managedUsers = await db.user.findMany({
        where: { managerId: auth.userId, isActive: true },
        select: { id: true },
      });
      const ids = [auth.userId, ...managedUsers.map((u) => u.id)];
      userFilter = { userId: { in: ids } };
    }

    const leaves = await db.leaveRequest.findMany({
      where: {
        ...userFilter,
        status: { in: ["approved", "pending"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        user: { select: { id: true, fullName: true, department: true } },
      },
      orderBy: { startDate: "asc" },
    });

    const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });

    res.json({
      success: true,
      data: {
        leaves: leaves.map((l) => ({
          id: l.id,
          userId: l.userId,
          userName: l.user.fullName,
          department: l.user.department,
          leaveType: l.leaveType,
          startDate: l.startDate.toISOString().split("T")[0],
          endDate: l.endDate.toISOString().split("T")[0],
          workingDays: l.workingDays,
          status: l.status,
        })),
        holidays: holidays.map((h) => ({
          id: h.id,
          name: h.name,
          date: h.date.toISOString().split("T")[0],
          isRecurring: h.isRecurring,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
