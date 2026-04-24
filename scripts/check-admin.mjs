import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true,
    isActive: true,
    forcePasswordChange: true,
    passwordHash: true,
    role: { select: { name: true } },
  },
});

console.log("Users in DB:", users.length);
for (const u of users) {
  const matches = await compare("Admin@123!", u.passwordHash);
  console.log({
    email: u.email,
    fullName: u.fullName,
    role: u.role?.name,
    isActive: u.isActive,
    forcePasswordChange: u.forcePasswordChange,
    hashPrefix: u.passwordHash.slice(0, 10),
    matchesAdmin123: matches,
  });
}

await prisma.$disconnect();
