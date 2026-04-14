import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  "pipeline.view", "pipeline.create", "pipeline.edit", "pipeline.delete",
  "outreach.view", "outreach.create", "outreach.edit", "outreach.delete",
  "research.view", "research.create", "research.edit", "research.delete",
  "legal.view", "legal.create", "legal.edit", "legal.delete",
  "finance.view", "finance.create", "finance.edit", "finance.delete",
  "documents.view", "documents.create", "documents.edit", "documents.delete",
  "leave.view_own", "leave.apply", "leave.approve_all",
  "timelog.view_own", "timelog.view_all", "timelog.edit_all",
  "activitylog.view_own", "activitylog.view_all",
  "users.view", "users.create", "users.edit", "users.deactivate",
  "roles.manage", "audit.view", "settings.manage",
];

const ANALYST_PERMISSIONS = [
  "pipeline.view", "pipeline.create", "pipeline.edit", "pipeline.delete",
  "outreach.view", "outreach.create", "outreach.edit", "outreach.delete",
  "research.view", "research.create", "research.edit", "research.delete",
  "leave.view_own", "leave.apply",
  "timelog.view_own",
  "activitylog.view_own",
  "documents.view",
];

const OPERATIONS_PERMISSIONS = [
  "legal.view", "legal.create", "legal.edit", "legal.delete",
  "finance.view", "finance.create", "finance.edit", "finance.delete",
  "documents.view", "documents.create", "documents.edit", "documents.delete",
  "leave.view_own", "leave.apply",
  "timelog.view_own",
  "activitylog.view_own",
];

async function main() {
  console.log("Seeding database...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { permissions: ALL_PERMISSIONS },
    create: {
      name: "admin",
      displayName: "Admin",
      permissions: ALL_PERMISSIONS,
    },
  });

  const analystRole = await prisma.role.upsert({
    where: { name: "analyst" },
    update: { permissions: ANALYST_PERMISSIONS },
    create: {
      name: "analyst",
      displayName: "Analyst",
      permissions: ANALYST_PERMISSIONS,
    },
  });

  const operationsRole = await prisma.role.upsert({
    where: { name: "operations" },
    update: { permissions: OPERATIONS_PERMISSIONS },
    create: {
      name: "operations",
      displayName: "Operations",
      permissions: OPERATIONS_PERMISSIONS,
    },
  });

  console.log("Roles created:", adminRole.name, analystRole.name, operationsRole.name);

  // Create default admin user
  const passwordHash = await hash("Admin@123!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@firm.com" },
    update: {},
    create: {
      fullName: "System Admin",
      email: "admin@firm.com",
      passwordHash,
      roleId: adminRole.id,
      department: "Administration",
      forcePasswordChange: true,
    },
  });

  console.log("Admin user created:", adminUser.email);

  // Platform settings
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
      create: {
        key: setting.key,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: setting.value as any,
      },
    });
  }

  console.log("Platform settings created:", settings.length, "entries");
  console.log("\nSeed complete!");
  console.log("Default admin login: admin@firm.com / Admin@123!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
