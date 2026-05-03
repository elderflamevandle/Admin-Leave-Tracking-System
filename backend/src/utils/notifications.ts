import { db } from "../config/db";
import { logger } from "./logger";

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  } catch (error) {
    logger.error("Failed to create notification", { error: String(error), userId: input.userId });
  }
}

export async function notifyManagers(managerId: string, input: {
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: managerId,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  } catch (error) {
    logger.error("Failed to notify manager", { error: String(error), managerId });
  }
}

export async function notifyAdmins(input: {
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    const admins = await db.user.findMany({
      where: { role: { name: "admin" }, isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });
  } catch (error) {
    logger.error("Failed to notify admins", { error: String(error), title: input.title });
  }
}
