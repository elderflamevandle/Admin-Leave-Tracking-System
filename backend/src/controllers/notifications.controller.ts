import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.notification.count({ where: { userId: auth.userId, isRead: false } }),
    ]);

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = req.user!;

    await db.notification.updateMany({
      where: { userId: auth.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
