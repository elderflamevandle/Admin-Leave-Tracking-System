import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "../config/db";
import { hashPassword, hashToken } from "../utils/auth";
import { logAudit, getClientInfo } from "../utils/audit";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/email";
import { logger } from "../utils/logger";
import { rateLimits } from "../utils/rate-limit";
import { parsePagination, buildPaginationMeta } from "../utils/utils";
import crypto from "crypto";

function generateTempPassword(): string {
  return randomBytes(16).toString("base64url") + "A1!";
}

// Admin Users
export async function adminGetUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "25"), 10)));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "");
    const roleFilter = String(req.query.role ?? "");

    const where = {
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(roleFilter && { role: { name: roleFilter } }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: { role: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    res.json({
      success: true,
      data: safeUsers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    if (!await rateLimits.adminOps(auth.userId)) {
      res.status(429).json({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const { fullName, email, roleId, department, joinDate, sendWelcome = true } = req.body;

    if (!fullName || !email || !roleId) {
      res.status(400).json({ success: false, error: "Name, email, and role are required" });
      return;
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, error: "Email already in use" });
      return;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await db.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roleId,
        department,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        forcePasswordChange: true,
      },
      include: { role: true },
    });

    if (sendWelcome) {
      sendWelcomeEmail(email, fullName, tempPassword).catch((e) =>
        logger.error("Welcome email failed", { error: String(e) })
      );
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "users.created",
      details: `Created user ${email}`,
      metadata: { newUserId: user.id },
      ipAddress,
      userAgent,
      module: "Admin",
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({
      success: true,
      data: {
        user: safeUser,
        tempPassword: sendWelcome ? undefined : tempPassword,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { id } = req.params;
    const { fullName, email, roleId, department, isActive, leaveBalance } = req.body;

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(roleId && { roleId }),
        ...(department !== undefined && { department }),
        ...(isActive !== undefined && { isActive }),
        ...(leaveBalance !== undefined && { leaveBalance }),
      },
      include: { role: true },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "users.updated",
      details: `Updated user ${id}`,
      metadata: { updatedUserId: id },
      ipAddress,
      userAgent,
      module: "Admin",
    });

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
}

export async function adminForceLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { id } = req.params;
    await db.session.deleteMany({ where: { userId: id } });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "users.force_logout",
      details: `Force logged out user ${id}`,
      ipAddress,
      userAgent,
      module: "Admin",
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function adminResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { id } = req.params;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    await db.passwordResetToken.updateMany({
      where: { userId: id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const resetToken = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(user.email, resetToken).catch(console.error);

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "users.password_reset_sent",
      details: `Password reset sent to ${user.email}`,
      ipAddress,
      userAgent,
      module: "Admin",
    });

    res.json({ success: true, data: { message: "Reset email sent" } });
  } catch (error) {
    next(error);
  }
}

// Audit
export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const moduleParam = String(req.query.module ?? "");
    const eventKey = String(req.query.eventKey ?? "");
    const userId = String(req.query.userId ?? "");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (moduleParam) where.module = moduleParam;
    if (eventKey) where.eventKey = { contains: eventKey };
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
  } catch (error) {
    next(error);
  }
}

// Holidays
export async function getHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (!auth) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
    res.json({ success: true, data: holidays });
  } catch (error) {
    next(error);
  }
}

const CreateHolidaySchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().date("Invalid date"),
  isRecurring: z.boolean().default(true),
});

export async function createHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const parsed = CreateHolidaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const holiday = await db.holiday.create({
      data: {
        name: parsed.data.name,
        date: new Date(parsed.data.date),
        isRecurring: parsed.data.isRecurring,
      },
    });

    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    next(error);
  }
}

export async function deleteHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { id } = req.params;
    const holiday = await db.holiday.findUnique({ where: { id } });
    if (!holiday) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    await db.holiday.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Reports
export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin" && auth.role !== "manager") {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const year = parseInt(String(req.query.year ?? String(new Date().getFullYear())), 10);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const leaveByDept = await db.leaveRequest.groupBy({
      by: ["userId"],
      where: {
        status: "approved",
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
      _sum: { workingDays: true },
    });

    const userIds = leaveByDept.map((r) => r.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, department: true },
    });
    const userDeptMap: Record<string, string> = {};
    for (const u of users) userDeptMap[u.id] = u.department ?? "Unknown";

    const deptMap: Record<string, number> = {};
    for (const row of leaveByDept) {
      const dept = userDeptMap[row.userId] ?? "Unknown";
      deptMap[dept] = (deptMap[dept] ?? 0) + (row._sum.workingDays ?? 0);
    }
    const leaveByDepartment = Object.entries(deptMap).map(([department, days]) => ({ department, days }));

    const leaveByType = await db.leaveRequest.groupBy({
      by: ["leaveType"],
      where: {
        status: "approved",
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
      _count: { id: true },
      _sum: { workingDays: true },
    });

    const allLeaves = await db.leaveRequest.findMany({
      where: {
        status: { in: ["approved", "pending"] },
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
      select: { startDate: true, workingDays: true, status: true },
    });

    const monthlyMap: Record<string, { approved: number; pending: number }> = {};
    for (let m = 0; m < 12; m++) monthlyMap[String(m)] = { approved: 0, pending: 0 };
    for (const l of allLeaves) {
      const month = new Date(l.startDate).getMonth();
      if (l.status === "approved") monthlyMap[String(month)].approved += l.workingDays;
      else monthlyMap[String(month)].pending += l.workingDays;
    }
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const leaveByMonth = monthLabels.map((month, i) => ({
      month,
      approved: monthlyMap[String(i)].approved,
      pending: monthlyMap[String(i)].pending,
    }));

    const timeLogs = await db.timeLogEntry.findMany({
      where: {
        logDate: { gte: yearStart, lte: yearEnd },
        hoursWorked: { not: null },
      },
      select: { logDate: true, hoursWorked: true, userId: true },
    });

    const overtimeByMonth: Record<string, number> = {};
    for (let m = 0; m < 12; m++) overtimeByMonth[String(m)] = 0;
    for (const log of timeLogs) {
      if (Number(log.hoursWorked) > 8) {
        const month = new Date(log.logDate).getMonth();
        overtimeByMonth[String(month)]++;
      }
    }
    const overtimeByMonthData = monthLabels.map((month, i) => ({
      month,
      overtimeDays: overtimeByMonth[String(i)],
    }));

    const [totalEmployees, pendingLeaves, totalApprovedDays] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.leaveRequest.count({ where: { status: "pending" } }),
      db.leaveRequest.aggregate({
        where: { status: "approved", startDate: { gte: yearStart }, endDate: { lte: yearEnd } },
        _sum: { workingDays: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        year,
        summary: {
          totalEmployees,
          pendingLeaves,
          totalApprovedDays: totalApprovedDays._sum.workingDays ?? 0,
        },
        leaveByDepartment,
        leaveByType: leaveByType.map((r) => ({
          type: r.leaveType,
          count: r._count.id,
          days: r._sum.workingDays ?? 0,
        })),
        leaveByMonth,
        overtimeByMonth: overtimeByMonthData,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Roles
export async function getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const roles = await db.role.findMany({
      select: { id: true, name: true, displayName: true },
      orderBy: { displayName: "asc" },
    });

    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
}

// Settings
export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const settings = await db.platformSetting.findMany({ orderBy: { key: "asc" } });
    const settingsMap = Object.fromEntries(
      settings.map((s: { key: string; value: unknown }) => [s.key, s.value])
    );

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
}

export async function patchSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const body = req.body;
    for (const [key, value] of Object.entries(body)) {
      await db.platformSetting.upsert({
        where: { key },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: { value: value as any, updatedBy: auth.userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: { key, value: value as any, updatedBy: auth.userId },
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "settings.updated",
      details: `Updated settings: ${Object.keys(body).join(", ")}`,
      ipAddress,
      userAgent,
      module: "Admin",
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Leave Balance
export async function adjustLeaveBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;
    if (auth.role !== "admin") {
      res.status(403).json({ success: false, error: "Admin access required" });
      return;
    }

    const { id } = req.params;
    const { leaveBalance } = req.body;

    if (typeof leaveBalance !== "number") {
      res.status(400).json({ success: false, error: "leaveBalance must be a number" });
      return;
    }

    const updated = await db.user.update({
      where: { id },
      data: { leaveBalance },
    });

    const { ipAddress, userAgent } = getClientInfo(req);
    await logAudit({
      userId: auth.userId,
      eventKey: "users.leave_balance_adjusted",
      details: `Leave balance for user ${id} set to ${leaveBalance}`,
      ipAddress,
      userAgent,
      module: "Admin",
    });

    res.json({ success: true, data: { leaveBalance: updated.leaveBalance } });
  } catch (error) {
    next(error);
  }
}
