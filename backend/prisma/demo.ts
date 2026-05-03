/**
 * Demo data seed — run with: pnpm prisma:demo
 * Populates the DB with realistic fake data for presentation purposes.
 * Safe to re-run (clears & recreates demo user data each time).
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────

function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day);
}

function workingDays(count: number, startFrom: Date = new Date()): Date[] {
  const days: Date[] = [];
  const cursor = new Date(startFrom);
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days.reverse();
}

// Rotate through arrays deterministically using index
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding demo data...\n");

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  const roles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  if (!roleMap.admin || !roleMap.analyst || !roleMap.operations || !roleMap.manager) {
    console.error("❌ Run `pnpm prisma:seed` first to create roles.");
    process.exit(1);
  }

  // ── 2. Users ──────────────────────────────────────────────────────────────
  const pw = await hash("Demo@123!", 10);

  const usersData = [
    // Managers
    { fullName: "Sarah Chen",       email: "sarah.chen@firm.com",     role: "manager",    dept: "Investment",  balance: 14, joinDate: d(2023, 3, 15) },
    { fullName: "Priya Sharma",     email: "priya.sharma@firm.com",   role: "manager",    dept: "Operations",  balance: 16, joinDate: d(2022, 8, 1)  },
    // Analysts
    { fullName: "Alex Thompson",    email: "alex.t@firm.com",         role: "analyst",    dept: "Investment",  balance: 12, joinDate: d(2023, 6, 12) },
    { fullName: "James Wilson",     email: "james.w@firm.com",        role: "analyst",    dept: "Investment",  balance: 17, joinDate: d(2024, 1, 8)  },
    { fullName: "Emily Rodriguez",  email: "emily.r@firm.com",        role: "analyst",    dept: "Research",    balance: 8,  joinDate: d(2022, 11, 1) },
    { fullName: "Michael Park",     email: "michael.p@firm.com",      role: "analyst",    dept: "Investment",  balance: 15, joinDate: d(2024, 4, 22) },
    // Operations
    { fullName: "Olivia Kumar",     email: "olivia.k@firm.com",       role: "operations", dept: "Operations",  balance: 11, joinDate: d(2023, 2, 6)  },
    { fullName: "David Lee",        email: "david.l@firm.com",        role: "operations", dept: "Finance",     balance: 18, joinDate: d(2024, 7, 15) },
    { fullName: "Rachel Nguyen",    email: "rachel.n@firm.com",       role: "operations", dept: "Legal",       balance: 13, joinDate: d(2023, 9, 20) },
  ];

  const createdUsers: Record<string, string> = {}; // email → id

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { leaveBalance: u.balance },
      create: {
        fullName: u.fullName,
        email: u.email,
        passwordHash: pw,
        roleId: roleMap[u.role],
        department: u.dept,
        leaveBalance: u.balance,
        joinDate: u.joinDate,
        forcePasswordChange: false,
        isActive: true,
      },
    });
    createdUsers[u.email] = user.id;
    console.log(`  ✓ ${u.fullName} (${u.role})`);
  }

  // Assign managers
  await prisma.user.updateMany({
    where: { email: { in: ["alex.t@firm.com", "james.w@firm.com", "emily.r@firm.com", "michael.p@firm.com"] } },
    data: { managerId: createdUsers["sarah.chen@firm.com"] },
  });
  await prisma.user.updateMany({
    where: { email: { in: ["olivia.k@firm.com", "david.l@firm.com", "rachel.n@firm.com"] } },
    data: { managerId: createdUsers["priya.sharma@firm.com"] },
  });

  const allDemoIds = Object.values(createdUsers);

  // ── 3. Clear existing demo user data ──────────────────────────────────────
  await prisma.notification.deleteMany({ where: { userId: { in: allDemoIds } } });
  await prisma.activityLogEntry.deleteMany({ where: { userId: { in: allDemoIds } } });
  await prisma.timeLogEntry.deleteMany({ where: { userId: { in: allDemoIds } } });
  await prisma.leaveRequest.deleteMany({ where: { userId: { in: allDemoIds } } });
  await prisma.holiday.deleteMany({});
  console.log("\n  Cleared existing demo data\n");

  // ── 4. Holidays ───────────────────────────────────────────────────────────
  const holidays = [
    { name: "New Year's Day",   date: d(2026, 1, 1),  isRecurring: true  },
    { name: "Republic Day",     date: d(2026, 1, 26), isRecurring: true  },
    { name: "Holi",             date: d(2026, 3, 4),  isRecurring: false },
    { name: "Good Friday",      date: d(2026, 4, 3),  isRecurring: false },
    { name: "Independence Day", date: d(2026, 8, 15), isRecurring: true  },
    { name: "Gandhi Jayanti",   date: d(2026, 10, 2), isRecurring: true  },
    { name: "Diwali",           date: d(2026, 10, 20),isRecurring: false },
    { name: "Christmas Day",    date: d(2026, 12, 25),isRecurring: true  },
    // 2025 (recurring ones)
    { name: "New Year's Day",   date: d(2025, 1, 1),  isRecurring: true  },
    { name: "Republic Day",     date: d(2025, 1, 26), isRecurring: true  },
    { name: "Independence Day", date: d(2025, 8, 15), isRecurring: true  },
    { name: "Christmas Day",    date: d(2025, 12, 25),isRecurring: true  },
  ];
  await prisma.holiday.createMany({ data: holidays });
  console.log(`  ✓ ${holidays.length} holidays`);

  // ── 5. Leave Requests ─────────────────────────────────────────────────────
  type LeaveStatus = "approved" | "pending" | "rejected" | "cancelled";
  type LeaveType = "annual" | "sick" | "personal" | "other";

  const adminId = (await prisma.user.findUnique({ where: { email: "admin@firm.com" }, select: { id: true } }))?.id;

  const leaveData: Array<{
    userEmail: string; leaveType: LeaveType; start: Date; end: Date;
    workingDays: number; status: LeaveStatus; reason?: string; reviewerNote?: string;
  }> = [
    // 2025 leaves
    { userEmail: "alex.t@firm.com",    leaveType: "annual",   start: d(2025,3,10),  end: d(2025,3,14),  workingDays: 5, status: "approved", reason: "Family vacation" },
    { userEmail: "james.w@firm.com",   leaveType: "annual",   start: d(2025,4,7),   end: d(2025,4,11),  workingDays: 5, status: "approved", reason: "Planned holiday" },
    { userEmail: "james.w@firm.com",   leaveType: "personal", start: d(2025,6,2),   end: d(2025,6,2),   workingDays: 1, status: "rejected", reason: "Personal errand", reviewerNote: "Insufficient notice. Please reschedule." },
    { userEmail: "emily.r@firm.com",   leaveType: "annual",   start: d(2025,5,5),   end: d(2025,5,9),   workingDays: 5, status: "approved", reason: "Long weekend trip" },
    { userEmail: "emily.r@firm.com",   leaveType: "annual",   start: d(2025,12,22), end: d(2025,12,31), workingDays: 8, status: "approved", reason: "Year-end break" },
    { userEmail: "michael.p@firm.com", leaveType: "annual",   start: d(2025,9,15),  end: d(2025,9,19),  workingDays: 5, status: "approved", reason: "Wedding anniversary" },
    { userEmail: "olivia.k@firm.com",  leaveType: "annual",   start: d(2025,8,18),  end: d(2025,8,22),  workingDays: 5, status: "approved", reason: "Summer holiday" },
    { userEmail: "david.l@firm.com",   leaveType: "sick",     start: d(2025,1,8),   end: d(2025,1,10),  workingDays: 3, status: "approved", reason: "Flu" },
    { userEmail: "david.l@firm.com",   leaveType: "annual",   start: d(2025,11,3),  end: d(2025,11,7),  workingDays: 5, status: "approved", reason: "Diwali holiday" },
    { userEmail: "rachel.n@firm.com",  leaveType: "annual",   start: d(2025,7,7),   end: d(2025,7,11),  workingDays: 5, status: "approved", reason: "Family visit" },
    { userEmail: "rachel.n@firm.com",  leaveType: "annual",   start: d(2025,2,17),  end: d(2025,2,21),  workingDays: 5, status: "cancelled", reason: "Cancelled — plans changed" },
    { userEmail: "sarah.chen@firm.com",leaveType: "annual",   start: d(2025,10,6),  end: d(2025,10,10), workingDays: 5, status: "approved", reason: "Conference in Singapore" },
    { userEmail: "priya.sharma@firm.com",leaveType: "sick",   start: d(2025,3,17),  end: d(2025,3,18),  workingDays: 2, status: "approved", reason: "Not feeling well" },
    // 2026 leaves (current year)
    { userEmail: "alex.t@firm.com",    leaveType: "sick",     start: d(2026,2,3),   end: d(2026,2,4),   workingDays: 2, status: "approved", reason: "Cold & fever" },
    { userEmail: "james.w@firm.com",   leaveType: "sick",     start: d(2026,1,15),  end: d(2026,1,15),  workingDays: 1, status: "approved", reason: "Doctor appointment" },
    { userEmail: "michael.p@firm.com", leaveType: "annual",   start: d(2026,6,8),   end: d(2026,6,12),  workingDays: 5, status: "pending",  reason: "Summer vacation" },
    { userEmail: "olivia.k@firm.com",  leaveType: "personal", start: d(2026,5,12),  end: d(2026,5,12),  workingDays: 1, status: "pending",  reason: "Personal appointment" },
    { userEmail: "david.l@firm.com",   leaveType: "annual",   start: d(2026,3,23),  end: d(2026,3,27),  workingDays: 5, status: "approved", reason: "Spring break" },
    { userEmail: "rachel.n@firm.com",  leaveType: "annual",   start: d(2026,2,16),  end: d(2026,2,20),  workingDays: 5, status: "approved", reason: "Planned leave" },
    { userEmail: "emily.r@firm.com",   leaveType: "sick",     start: d(2026,4,7),   end: d(2026,4,8),   workingDays: 2, status: "approved", reason: "Migraine" },
    { userEmail: "sarah.chen@firm.com",leaveType: "annual",   start: d(2026,5,19),  end: d(2026,5,22),  workingDays: 4, status: "pending",  reason: "Pre-planned vacation" },
    { userEmail: "priya.sharma@firm.com",leaveType: "annual", start: d(2026,4,14),  end: d(2026,4,17),  workingDays: 4, status: "approved", reason: "Extended long weekend" },
  ];

  let leaveCount = 0;
  for (const l of leaveData) {
    const userId = createdUsers[l.userEmail];
    if (!userId) continue;
    await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType: l.leaveType,
        startDate: l.start,
        endDate: l.end,
        workingDays: l.workingDays,
        reason: l.reason,
        status: l.status,
        reviewedBy: l.status !== "pending" ? adminId ?? undefined : undefined,
        reviewerNote: l.reviewerNote,
        createdAt: new Date(l.start.getTime() - 7 * 24 * 60 * 60 * 1000), // submitted 1 week before
      },
    });
    leaveCount++;
  }
  console.log(`  ✓ ${leaveCount} leave requests`);

  // ── 6. Time Logs (last 45 working days) ───────────────────────────────────
  const logDays = workingDays(45);

  // Per-user patterns: [loginH, loginM, logoutH, logoutM, breakMin]
  const patterns: [number, number, number, number, number][] = [
    [9, 0,  17, 45, 45],
    [9, 15, 18, 30, 30],
    [9, 30, 19, 0,  45],
    [8, 45, 17, 30, 30],
    [9, 0,  18, 0,  45],
    [9, 10, 17, 50, 30],
    [9, 20, 18, 45, 60],
    [8, 30, 17, 0,  30],
    [9, 5,  18, 15, 45],
  ];

  const loginVariations  = [0, 5, 10, -5, 15, -10, 0, 5, -5];
  const logoutVariations = [0, 30, -15, 45, 0, 30, -30, 15, 60];

  const timeLogUsers = Object.keys(createdUsers);
  let tlCount = 0;

  for (let ui = 0; ui < timeLogUsers.length; ui++) {
    const userId = createdUsers[timeLogUsers[ui]];
    const [lh, lm, oh, om, br] = patterns[ui % patterns.length];

    for (let di = 0; di < logDays.length; di++) {
      const date = logDays[di];
      // Skip some days to simulate absences (every ~15th day)
      if ((ui + di) % 17 === 0) continue;

      const loginMin  = lh * 60 + lm  + loginVariations[(di + ui) % loginVariations.length];
      const logoutMin = oh * 60 + om  + logoutVariations[(di + ui) % logoutVariations.length];
      const loginTime  = `${String(Math.floor(loginMin / 60)).padStart(2, "0")}:${String(loginMin % 60).padStart(2, "0")}`;
      const logoutTime = `${String(Math.floor(logoutMin / 60)).padStart(2, "0")}:${String(logoutMin % 60).padStart(2, "0")}`;
      const hoursWorked = Math.max(0, Number(((logoutMin - loginMin - br) / 60).toFixed(2)));

      await prisma.timeLogEntry.create({
        data: {
          userId,
          logDate: date,
          loginTime,
          logoutTime,
          breakMinutes: br,
          hoursWorked,
          notes: di % 8 === 0 ? "Remote work" : null,
          createdAt: new Date(date.getTime() + 19 * 60 * 60 * 1000),
          updatedAt: new Date(date.getTime() + 19 * 60 * 60 * 1000),
        },
      });
      tlCount++;
    }
  }
  console.log(`  ✓ ${tlCount} time log entries`);

  // ── 7. Activity Logs (last 14 working days) ────────────────────────────────
  const actDays = workingDays(14);

  const activitiesByRole: Record<string, string[]> = {
    analyst: [
      "Reviewed Series A pitch deck for HealthTech startup. Prepared preliminary analysis.",
      "Due diligence calls with Founder of CleanEnergy Co. — reviewed financials.",
      "Attended portfolio company board meeting. Drafted minutes and action items.",
      "Researched SaaS market comps. Updated deal memo for AgriTech opportunity.",
      "Pipeline review meeting. Updated CRM with 3 new sourced deals.",
      "Participated in LP update call. Prepared Q1 portfolio performance slides.",
      "Screened 8 new inbound decks. Shortlisted 2 for partner review.",
      "Follow-up due diligence on BioTech deal — reviewed cap table.",
    ],
    manager: [
      "Weekly team sync. Reviewed analyst deal memos. Provided feedback.",
      "LP reporting and quarterly narrative update. Reviewed fund performance.",
      "Portfolio company check-in calls — 3 companies. Noted key risks.",
      "Deal committee preparation. Finalized investment thesis deck.",
      "Onboarding new analyst. Reviewed team workload allocation.",
      "Partner meeting. Presented 2 new deal opportunities for consideration.",
    ],
    operations: [
      "Updated fund administration documents. Coordinated with legal counsel.",
      "Vendor invoice review and approval workflow. Processed 5 invoices.",
      "Compliance review for Q1. Prepared regulatory filing summary.",
      "Coordinated office operations and vendor contracts renewal.",
      "Prepared NDA templates for new portfolio companies.",
      "Finance reconciliation for March. Reviewed expense reports.",
      "Updated employee handbook. Circulated to all staff for review.",
    ],
  };

  const tagsByRole: Record<string, string[][]> = {
    analyst:    [["Deal Work", "Research"], ["Deal Work"], ["Research", "BD"], ["BD", "Research"], ["Deal Work", "Admin"]],
    manager:    [["Admin", "Deal Work"],    ["BD", "Admin"], ["Deal Work"],    ["Admin"],           ["Operations"]],
    operations: [["Operations", "Admin"],  ["Operations"], ["Admin"],         ["Legal"],           ["Finance", "Operations"]],
  };

  const blockersSamples = [
    null, null, null,
    "Waiting on audited financials from portfolio company.",
    "LP portal access pending IT setup.",
    null,
    "Legal review taking longer than expected.",
    null, null,
  ];

  let actCount = 0;
  for (let ui = 0; ui < timeLogUsers.length; ui++) {
    const userId = createdUsers[timeLogUsers[ui]];
    const userEmail = timeLogUsers[ui];
    const roleKey = usersData.find((u) => u.email === userEmail)?.role as string;
    const roleGroup = roleKey === "manager" ? "manager" : roleKey === "operations" ? "operations" : "analyst";
    const actList  = activitiesByRole[roleGroup];
    const tagsList = tagsByRole[roleGroup];

    for (let di = 0; di < actDays.length; di++) {
      if ((ui + di) % 11 === 0) continue; // skip some days
      await prisma.activityLogEntry.create({
        data: {
          userId,
          logDate: actDays[di],
          activities: pick(actList, di + ui),
          blockers:   blockersSamples[(di + ui) % blockersSamples.length] as string | null,
          tags:       pick(tagsList, di + ui),
          isLocked:   di < 7,
          createdAt:  new Date(actDays[di].getTime() + 18 * 60 * 60 * 1000),
          updatedAt:  new Date(actDays[di].getTime() + 18 * 60 * 60 * 1000),
        },
      });
      actCount++;
    }
  }
  console.log(`  ✓ ${actCount} activity log entries`);

  // ── 8. Notifications ──────────────────────────────────────────────────────
  const adminUserId = (await prisma.user.findUnique({ where: { email: "admin@firm.com" }, select: { id: true } }))?.id;
  const sarahId     = createdUsers["sarah.chen@firm.com"];
  const priyaId     = createdUsers["priya.sharma@firm.com"];

  const notifications = [
    { userId: adminUserId!, title: "New Leave Request", message: "Michael Park requested annual leave (5 days) from Jun 8–12, 2026.", link: "/leave/manage", isRead: false },
    { userId: adminUserId!, title: "New Leave Request", message: "Olivia Kumar requested personal leave on May 12, 2026.", link: "/leave/manage", isRead: false },
    { userId: adminUserId!, title: "Sarah Chen — Pending Leave", message: "Sarah Chen has 4 days pending approval from May 19.", link: "/leave/manage", isRead: false },
    { userId: adminUserId!, title: "Time Log Alert", message: "3 employees have not submitted time logs for last Friday.", link: "/timelog/all", isRead: true },
    { userId: adminUserId!, title: "System Health", message: "Database backup completed successfully.", isRead: true },
    { userId: sarahId,     title: "Leave Approved", message: "Your annual leave Apr 14–17 has been approved by admin.", link: "/leave", isRead: false },
    { userId: sarahId,     title: "Team: New Leave Request", message: "Michael Park submitted a leave request — please review.", link: "/leave/manage", isRead: false },
    { userId: priyaId,     title: "Leave Approved", message: "Your annual leave Apr 14–17 has been approved.", link: "/leave", isRead: true },
    { userId: priyaId,     title: "Team: New Request", message: "Olivia Kumar submitted a personal leave request.", link: "/leave/manage", isRead: false },
    { userId: createdUsers["alex.t@firm.com"],    title: "Leave Approved", message: "Your sick leave Feb 3–4 has been approved.", link: "/leave", isRead: true },
    { userId: createdUsers["michael.p@firm.com"], title: "Leave Submitted", message: "Your annual leave request for Jun 8–12 is pending approval.", link: "/leave", isRead: true },
    { userId: createdUsers["olivia.k@firm.com"],  title: "Leave Submitted", message: "Your personal leave for May 12 is pending approval.", link: "/leave", isRead: true },
    { userId: createdUsers["emily.r@firm.com"],   title: "Leave Approved", message: "Your sick leave Apr 7–8 has been approved.", link: "/leave", isRead: false },
    { userId: createdUsers["james.w@firm.com"],   title: "Leave Rejected", message: "Your personal leave on Jun 2, 2025 was not approved. Reason: Insufficient notice.", link: "/leave", isRead: true },
    { userId: createdUsers["david.l@firm.com"],   title: "Leave Approved", message: "Your annual leave Mar 23–27 has been approved.", link: "/leave", isRead: true },
  ];

  await prisma.notification.createMany({
    data: notifications.map((n, i) => ({
      ...n,
      createdAt: new Date(Date.now() - (notifications.length - i) * 2 * 60 * 60 * 1000),
    })),
  });
  console.log(`  ✓ ${notifications.length} notifications`);

  // ── 9. Audit logs ─────────────────────────────────────────────────────────
  if (adminUserId) {
    const auditEntries = [
      { eventKey: "leave.approved",  details: "Approved annual leave for Alex Thompson (Mar 10–14, 2025)", module: "Leave", metadata: {} },
      { eventKey: "leave.approved",  details: "Approved annual leave for Emily Rodriguez (May 5–9, 2025)", module: "Leave", metadata: {} },
      { eventKey: "leave.rejected",  details: "Rejected personal leave for James Wilson — Insufficient notice", module: "Leave", metadata: {} },
      { eventKey: "leave.approved",  details: "Approved annual leave for David Lee (Nov 3–7, 2025)", module: "Leave", metadata: {} },
      { eventKey: "user.created",    details: "Created user account: alex.t@firm.com (Analyst)", module: "Users", metadata: {} },
      { eventKey: "user.created",    details: "Created user account: sarah.chen@firm.com (Manager)", module: "Users", metadata: {} },
      { eventKey: "settings.updated",details: "Updated platform setting: firm_name", module: "Settings", metadata: {} },
      { eventKey: "leave.approved",  details: "Approved annual leave for Rachel Nguyen (Jul 7–11, 2025)", module: "Leave", metadata: {} },
      { eventKey: "leave.approved",  details: "Approved sick leave for Priya Sharma (Mar 17–18, 2025)", module: "Leave", metadata: {} },
      { eventKey: "leave.approved",  details: "Approved annual leave for Michael Park (Sep 15–19, 2025)", module: "Leave", metadata: {} },
    ];

    await prisma.auditLog.createMany({
      data: auditEntries.map((e, i) => ({
        userId: adminUserId,
        eventKey: e.eventKey,
        details: e.details,
        metadata: e.metadata,
        ipAddress: "10.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        module: e.module,
        createdAt: new Date(Date.now() - (auditEntries.length - i) * 3 * 24 * 60 * 60 * 1000),
      })),
    });
    console.log(`  ✓ ${auditEntries.length} audit log entries`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Demo data seeded successfully!

Demo accounts (password: Demo@123!):
  sarah.chen@firm.com    → Manager   (Investment)
  priya.sharma@firm.com  → Manager   (Operations)
  alex.t@firm.com        → Analyst   (Investment)
  james.w@firm.com       → Analyst   (Investment)
  emily.r@firm.com       → Analyst   (Research)
  michael.p@firm.com     → Analyst   (Investment)
  olivia.k@firm.com      → Operations
  david.l@firm.com       → Operations (Finance)
  rachel.n@firm.com      → Operations (Legal)

Admin account: admin@firm.com / Admin@123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => { console.error("Demo seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
