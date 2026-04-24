import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const email = "admin@firm.com";
const newPassword = "Admin@123!";

const passwordHash = await hash(newPassword, 12);

const user = await prisma.user.update({
  where: { email },
  data: { passwordHash, forcePasswordChange: true, isActive: true },
  select: { email: true, fullName: true, isActive: true, forcePasswordChange: true },
});

console.log("Password reset for:", user);
console.log(`Login with: ${email} / ${newPassword}`);

await prisma.$disconnect();
