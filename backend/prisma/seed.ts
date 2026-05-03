import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { ROLE_PERMISSIONS } from "../src/config/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { permissions: ROLE_PERMISSIONS.admin },
    create: { name: "admin", displayName: "Admin", permissions: ROLE_PERMISSIONS.admin },
  });

  const analystRole = await prisma.role.upsert({
    where: { name: "analyst" },
    update: { permissions: ROLE_PERMISSIONS.analyst },
    create: { name: "analyst", displayName: "Analyst", permissions: ROLE_PERMISSIONS.analyst },
  });

  const operationsRole = await prisma.role.upsert({
    where: { name: "operations" },
    update: { permissions: ROLE_PERMISSIONS.operations },
    create: { name: "operations", displayName: "Operations", permissions: ROLE_PERMISSIONS.operations },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "manager" },
    update: { permissions: ROLE_PERMISSIONS.manager },
    create: { name: "manager", displayName: "Manager", permissions: ROLE_PERMISSIONS.manager },
  });

  console.log("Roles created:", adminRole.name, analystRole.name, operationsRole.name, managerRole.name);

  const passwordHash = await hash("Admin@123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@firm.com" },
    update: { passwordHash, forcePasswordChange: false },
    create: {
      fullName: "System Admin",
      email: "admin@firm.com",
      passwordHash,
      roleId: adminRole.id,
      department: "Administration",
      forcePasswordChange: false,
    },
  });

  console.log("Admin user created:", adminUser.email);
  console.log("Change the admin password immediately after first login.");

  const settings = [
    { key: "working_hours_per_day", value: 8 },
    { key: "working_days", value: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { key: "default_leave_days", value: 20 },
    { key: "self_edit_window_days", value: 7 },
    { key: "time_format", value: "12h" },
    { key: "firm_name", value: "VC Firm" },
    { key: "firm_logo_url", value: null },
    { key: "activity_tags", value: ["Deal Work", "Research", "Operations", "Admin", "BD", "Other"] },
    { key: "FEATURE_PIPELINE", value: false },
    { key: "FEATURE_OUTREACH", value: false },
    { key: "FEATURE_RESEARCH", value: false },
    { key: "FEATURE_LEGAL", value: false },
    { key: "FEATURE_FINANCE", value: false },
    { key: "FEATURE_DOCUMENTS", value: false },
    { key: "FEATURE_PROJECTS", value: false },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: setting.value as any },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { key: setting.key, value: setting.value as any },
    });
  }

  console.log("Platform settings created:", settings.length, "entries");
  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
