import { db } from "./db";

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  });
}

export async function notifyAdmins(input: {
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  const admins = await db.user.findMany({
    where: {
      role: { name: "admin" },
      isActive: true,
    },
    select: { id: true },
  });

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: input.title,
      message: input.message,
      link: input.link,
    })),
  });
}
