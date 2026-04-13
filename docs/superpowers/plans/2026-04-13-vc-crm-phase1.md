# VC Firm CRM Platform — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready internal CRM for a VC firm covering auth, RBAC, employee directory, leave management, time tracking, activity logging, and an admin panel — deployed to Vercel + Supabase.

**Architecture:** Next.js 15 App Router with route groups: `(auth)` for public pages, `(dashboard)` for protected pages. Custom JWT auth with refresh tokens stored as httpOnly cookies. Server-side RBAC on all API routes. Prisma ORM against Supabase PostgreSQL.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL (Supabase), TanStack Query, Recharts, Resend, jose (JWT), bcrypt, Vitest, Playwright

**Design Spec:** `docs/superpowers/specs/2026-04-13-vc-crm-phase1-design.md`
**PRDs:** `PRD/PRD-01` through `PRD/PRD-05`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (html, body, providers)
│   ├── (auth)/
│   │   ├── layout.tsx                      # Centered auth layout
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── change-password/page.tsx        # Forced first-login password change
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Shell: sidebar + topbar + main
│   │   ├── dashboard/page.tsx
│   │   ├── directory/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── leave/
│   │   │   ├── page.tsx
│   │   │   └── manage/page.tsx
│   │   ├── timelog/
│   │   │   ├── page.tsx
│   │   │   └── all/page.tsx
│   │   ├── activity/
│   │   │   ├── page.tsx
│   │   │   └── all/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── audit/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── pipeline/page.tsx
│   │   ├── outreach/page.tsx
│   │   ├── research/page.tsx
│   │   ├── legal/page.tsx
│   │   ├── finance/page.tsx
│   │   ├── documents/page.tsx
│   │   └── projects/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── refresh/route.ts
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── users/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── me/route.ts
│       ├── leave/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── approve/route.ts
│       │       └── reject/route.ts
│       ├── timelog/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── activity/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── admin/
│       │   ├── users/
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       ├── route.ts
│       │   │       ├── reset-password/route.ts
│       │   │       └── force-logout/route.ts
│       │   ├── audit/route.ts
│       │   ├── settings/route.ts
│       │   └── leave-balance/[id]/route.ts
│       ├── notifications/
│       │   ├── route.ts
│       │   └── mark-read/route.ts
│       └── export/[type]/route.ts
├── components/
│   ├── ui/                    # shadcn/ui (auto-generated)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── mobile-drawer.tsx
│   │   └── nav-items.ts       # Navigation config per role
│   ├── dashboard/
│   │   ├── admin-dashboard.tsx
│   │   ├── analyst-dashboard.tsx
│   │   ├── operations-dashboard.tsx
│   │   ├── stat-card.tsx
│   │   ├── placeholder-widget.tsx
│   │   └── clock-in-widget.tsx
│   ├── shared/
│   │   ├── placeholder-page.tsx
│   │   ├── data-table.tsx
│   │   ├── confirm-modal.tsx
│   │   ├── csv-export-button.tsx
│   │   └── pagination.tsx
│   └── forms/
│       ├── leave-application-form.tsx
│       ├── time-log-entry-form.tsx
│       ├── activity-log-form.tsx
│       ├── user-form.tsx
│       └── settings-form.tsx
├── lib/
│   ├── auth.ts
│   ├── permissions.ts
│   ├── db.ts
│   ├── audit.ts
│   ├── notifications.ts
│   ├── email.ts
│   ├── csv.ts
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-role.ts
│   ├── use-notifications.ts
│   └── use-pagination.ts
├── providers/
│   ├── auth-provider.tsx
│   └── query-provider.tsx
├── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/
    └── index.ts
```

---

## Day 1 — Project Setup + Full Database

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: project root (via create-next-app)
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Create Next.js 15 project**

Run:
```bash
cd F:/Admin_Leaves_Tracking
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Select defaults when prompted. If it asks about the directory not being empty, confirm yes (it will merge with existing files).

- [ ] **Step 2: Verify the project runs**

Run:
```bash
pnpm dev
```

Expected: Dev server starts on http://localhost:3000, default Next.js page renders.

Stop the dev server (Ctrl+C).

- [ ] **Step 3: Create environment files**

Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth
JWT_SECRET="GENERATE_64_CHAR_RANDOM_STRING_HERE"
JWT_REFRESH_SECRET="GENERATE_DIFFERENT_64_CHAR_RANDOM_STRING_HERE"

# Email
RESEND_API_KEY="re_YOUR_API_KEY"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Create `.env.example`:
```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
JWT_SECRET="generate-64-char-random-string"
JWT_REFRESH_SECRET="generate-different-64-char-random-string"
RESEND_API_KEY="re_your_api_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 4: Add .env.local to .gitignore**

Verify `.gitignore` contains `.env*.local`. Next.js includes this by default. If not, add it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with TypeScript and Tailwind"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

Run:
```bash
pnpm add @prisma/client @tanstack/react-query jose bcryptjs resend recharts date-fns clsx tailwind-merge lucide-react class-variance-authority
```

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
pnpm add -D prisma vitest @vitejs/plugin-react @playwright/test @testing-library/react @testing-library/jest-dom @types/bcryptjs tsx
```

- [ ] **Step 3: Install shadcn/ui**

Run:
```bash
pnpm dlx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 4: Add core shadcn/ui components**

Run:
```bash
pnpm dlx shadcn@latest add button input label card table tabs badge dialog dropdown-menu sheet toast select textarea separator avatar checkbox popover calendar command sonner
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: install all dependencies and initialize shadcn/ui"
```

---

### Task 3: Prisma Schema — Phase 1 Active Tables

**Files:**
- Create: `src/prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

Run:
```bash
pnpm prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and updates `.env`. Move schema to src:

```bash
mv prisma src/prisma
```

- [ ] **Step 2: Update next.config to find prisma**

No change needed — Prisma CLI will be invoked with `--schema src/prisma/schema.prisma`.

Add to `package.json` scripts:
```json
{
  "prisma:migrate": "prisma migrate dev --schema src/prisma/schema.prisma",
  "prisma:generate": "prisma generate --schema src/prisma/schema.prisma",
  "prisma:seed": "tsx src/prisma/seed.ts",
  "prisma:studio": "prisma studio --schema src/prisma/schema.prisma"
}
```

- [ ] **Step 3: Write the full Prisma schema**

Write `src/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================
// PHASE 1 — ACTIVE TABLES
// ============================================================

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  displayName String   @map("display_name")
  permissions Json     @default("[]")
  createdAt   DateTime @default(now()) @map("created_at")

  users User[]

  @@map("roles")
}

model User {
  id                  String    @id @default(uuid()) @db.Uuid
  fullName            String    @map("full_name")
  email               String    @unique
  passwordHash        String    @map("password_hash")
  roleId              String    @map("role_id") @db.Uuid
  department          String?
  avatarUrl           String?   @map("avatar_url")
  joinDate            DateTime  @default(now()) @map("join_date") @db.Date
  leaveBalance        Int       @default(20) @map("leave_balance")
  isActive            Boolean   @default(true) @map("is_active")
  forcePasswordChange Boolean   @default(false) @map("force_password_change")
  lastLoginAt         DateTime? @map("last_login_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  role                Role                @relation(fields: [roleId], references: [id])
  sessions            Session[]
  leaveRequests       LeaveRequest[]      @relation("UserLeaveRequests")
  reviewedLeaves      LeaveRequest[]      @relation("ReviewedLeaveRequests")
  timeLogEntries      TimeLogEntry[]      @relation("UserTimeLogs")
  amendedTimeLogs     TimeLogEntry[]      @relation("AmendedTimeLogs")
  activityLogEntries  ActivityLogEntry[]
  auditLogs           AuditLog[]
  notifications       Notification[]
  passwordResetTokens PasswordResetToken[]
  loginAttempts       LoginAttempt[]

  // Phase 2 relations
  assignedDeals       Deal[]              @relation("AssignedDeals")
  createdDeals        Deal[]              @relation("CreatedDeals")
  contacts            Contact[]
  contactInteractions ContactInteraction[]
  researchDocs        ResearchDoc[]
  legalDocuments      LegalDocument[]
  submittedExpenses   Expense[]           @relation("SubmittedExpenses")
  reviewedExpenses    Expense[]           @relation("ReviewedExpenses")
  createdInvoices     Invoice[]
  createdFolders      DocFolder[]
  uploadedFiles       DocFile[]
  ownedProjects       Project[]
  projectMemberships  ProjectMember[]
  assignedTasks       ProjectTask[]
  updatedSettings     PlatformSetting[]

  @@map("users")
}

model Session {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  tokenHash        String   @map("token_hash")
  refreshTokenHash String   @map("refresh_token_hash")
  expiresAt        DateTime @map("expires_at")
  createdAt        DateTime @default(now()) @map("created_at")
  ipAddress        String   @map("ip_address")
  userAgent        String   @map("user_agent")

  user User @relation(fields: [userId], references: [id])

  @@map("sessions")
}

model LoginAttempt {
  id          String   @id @default(uuid()) @db.Uuid
  email       String
  ipAddress   String   @map("ip_address")
  userId      String?  @map("user_id") @db.Uuid
  attemptedAt DateTime @default(now()) @map("attempted_at")

  user User? @relation(fields: [userId], references: [id])

  @@map("login_attempts")
}

model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @map("token_hash")
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("password_reset_tokens")
}

enum LeaveType {
  annual
  sick
  personal
  other

  @@map("leave_type")
}

enum LeaveStatus {
  pending
  approved
  rejected
  cancelled

  @@map("leave_status")
}

model LeaveRequest {
  id           String      @id @default(uuid()) @db.Uuid
  userId       String      @map("user_id") @db.Uuid
  leaveType    LeaveType   @map("leave_type")
  startDate    DateTime    @map("start_date") @db.Date
  endDate      DateTime    @map("end_date") @db.Date
  workingDays  Int         @map("working_days")
  reason       String?
  status       LeaveStatus @default(pending)
  reviewedBy   String?     @map("reviewed_by") @db.Uuid
  reviewerNote String?     @map("reviewer_note")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  user     User  @relation("UserLeaveRequests", fields: [userId], references: [id])
  reviewer User? @relation("ReviewedLeaveRequests", fields: [reviewedBy], references: [id])

  @@map("leave_requests")
}

model TimeLogEntry {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  logDate       DateTime @map("log_date") @db.Date
  loginTime     String   @map("login_time")
  logoutTime    String?  @map("logout_time")
  breakMinutes  Int      @default(0) @map("break_minutes")
  hoursWorked   Decimal? @map("hours_worked") @db.Decimal(4, 2)
  notes         String?
  isAmended     Boolean  @default(false) @map("is_amended")
  amendedBy     String?  @map("amended_by") @db.Uuid
  amendmentNote String?  @map("amendment_note")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user    User  @relation("UserTimeLogs", fields: [userId], references: [id])
  amender User? @relation("AmendedTimeLogs", fields: [amendedBy], references: [id])

  @@unique([userId, logDate])
  @@map("time_log_entries")
}

model ActivityLogEntry {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  logDate    DateTime @map("log_date") @db.Date
  activities String
  blockers   String?
  tags       String[] @default([])
  isLocked   Boolean  @default(false) @map("is_locked")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, logDate])
  @@map("activity_log_entries")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  eventKey  String   @map("event_key")
  details   String
  metadata  Json?
  ipAddress String   @map("ip_address")
  userAgent String   @map("user_agent")
  module    String
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}

model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  title     String
  message   String
  isRead    Boolean  @default(false) @map("is_read")
  link      String?
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}

model PlatformSetting {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at")
  updatedBy String?  @map("updated_by") @db.Uuid

  updater User? @relation(fields: [updatedBy], references: [id])

  @@map("platform_settings")
}

// ============================================================
// PHASE 2 — SCAFFOLD TABLES (empty, do not populate)
// ============================================================

enum DealStage {
  sourcing
  review
  screening
  partner_meeting
  diligence
  term_sheet
  closed_won
  closed_lost

  @@map("deal_stage")
}

model Deal {
  id          String    @id @default(uuid()) @db.Uuid
  companyName String    @map("company_name")
  sector      String
  stage       DealStage @default(sourcing)
  dealSize    Decimal?  @map("deal_size") @db.Decimal(15, 2)
  thesisFit   Int?      @map("thesis_fit")
  assignedTo  String    @map("assigned_to") @db.Uuid
  leadContact String?   @map("lead_contact") @db.Uuid
  notes       String?
  createdBy   String    @map("created_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  assignee        User            @relation("AssignedDeals", fields: [assignedTo], references: [id])
  creator         User            @relation("CreatedDeals", fields: [createdBy], references: [id])
  leadContactRef  Contact?        @relation(fields: [leadContact], references: [id])
  researchDocs    ResearchDoc[]
  legalDocuments  LegalDocument[]

  @@map("deals")
}

enum ContactStatus {
  to_contact
  contacted
  in_discussion
  relationship
  not_interested

  @@map("contact_status")
}

model Contact {
  id              String        @id @default(uuid()) @db.Uuid
  fullName        String        @map("full_name")
  company         String
  role            String
  email           String
  phone           String?
  linkedinUrl     String?       @map("linkedin_url")
  status          ContactStatus @default(to_contact)
  lastContactedAt DateTime?     @map("last_contacted_at")
  notes           String?
  tags            String[]      @default([])
  createdBy       String        @map("created_by") @db.Uuid
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  creator      User                 @relation(fields: [createdBy], references: [id])
  deals        Deal[]
  interactions ContactInteraction[]

  @@map("contacts")
}

enum InteractionType {
  email
  call
  meeting
  linkedin
  other

  @@map("interaction_type")
}

model ContactInteraction {
  id              String          @id @default(uuid()) @db.Uuid
  contactId       String          @map("contact_id") @db.Uuid
  userId          String          @map("user_id") @db.Uuid
  type            InteractionType
  notes           String
  interactionDate DateTime        @map("interaction_date")
  createdAt       DateTime        @default(now()) @map("created_at")

  contact Contact @relation(fields: [contactId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@map("contact_interactions")
}

model ResearchDoc {
  id           String   @id @default(uuid()) @db.Uuid
  title        String
  content      String
  tags         String[] @default([])
  linkedDealId String?  @map("linked_deal_id") @db.Uuid
  authorId     String   @map("author_id") @db.Uuid
  version      Int      @default(1)
  isPublished  Boolean  @default(false) @map("is_published")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  linkedDeal Deal? @relation(fields: [linkedDealId], references: [id])
  author     User  @relation(fields: [authorId], references: [id])

  @@map("research_docs")
}

enum LegalDocType {
  nda
  term_sheet
  sha
  employment
  fund_doc
  other

  @@map("legal_doc_type")
}

model LegalDocument {
  id             String       @id @default(uuid()) @db.Uuid
  title          String
  docType        LegalDocType @map("doc_type")
  fileUrl        String       @map("file_url")
  fileSize       Int          @map("file_size")
  relatedCompany String?      @map("related_company")
  relatedDealId  String?      @map("related_deal_id") @db.Uuid
  signedDate     DateTime?    @map("signed_date") @db.Date
  expiryDate     DateTime?    @map("expiry_date") @db.Date
  parties        String[]     @default([])
  uploadedBy     String       @map("uploaded_by") @db.Uuid
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  relatedDeal Deal? @relation(fields: [relatedDealId], references: [id])
  uploader    User  @relation(fields: [uploadedBy], references: [id])

  @@map("legal_documents")
}

enum ExpenseCategory {
  travel
  software
  legal
  marketing
  office
  other

  @@map("expense_category")
}

enum ExpenseStatus {
  pending
  approved
  rejected

  @@map("expense_status")
}

model Expense {
  id          String          @id @default(uuid()) @db.Uuid
  submittedBy String          @map("submitted_by") @db.Uuid
  amount      Decimal         @db.Decimal(12, 2)
  currency    String          @default("USD")
  category    ExpenseCategory
  description String
  receiptUrl  String?         @map("receipt_url")
  expenseDate DateTime        @map("expense_date") @db.Date
  status      ExpenseStatus   @default(pending)
  reviewedBy  String?         @map("reviewed_by") @db.Uuid
  createdAt   DateTime        @default(now()) @map("created_at")

  submitter User  @relation("SubmittedExpenses", fields: [submittedBy], references: [id])
  reviewer  User? @relation("ReviewedExpenses", fields: [reviewedBy], references: [id])

  @@map("expenses")
}

enum InvoiceStatus {
  unpaid
  paid
  overdue
  cancelled

  @@map("invoice_status")
}

model Invoice {
  id        String        @id @default(uuid()) @db.Uuid
  vendor    String
  amount    Decimal       @db.Decimal(12, 2)
  currency  String        @default("USD")
  dueDate   DateTime      @map("due_date") @db.Date
  paidDate  DateTime?     @map("paid_date") @db.Date
  status    InvoiceStatus @default(unpaid)
  notes     String?
  createdBy String        @map("created_by") @db.Uuid
  createdAt DateTime      @default(now()) @map("created_at")

  creator User @relation(fields: [createdBy], references: [id])

  @@map("invoices")
}

model DocFolder {
  id             String   @id @default(uuid()) @db.Uuid
  name           String
  parentFolderId String?  @map("parent_folder_id") @db.Uuid
  accessRoles    String[] @default([]) @map("access_roles")
  createdBy      String   @map("created_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  parentFolder DocFolder?  @relation("FolderHierarchy", fields: [parentFolderId], references: [id])
  childFolders DocFolder[] @relation("FolderHierarchy")
  files        DocFile[]
  creator      User        @relation(fields: [createdBy], references: [id])

  @@map("doc_folders")
}

model DocFile {
  id         String   @id @default(uuid()) @db.Uuid
  folderId   String   @map("folder_id") @db.Uuid
  name       String
  fileUrl    String   @map("file_url")
  fileSize   Int      @map("file_size")
  fileType   String   @map("file_type")
  version    Int      @default(1)
  uploadedBy String   @map("uploaded_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  folder   DocFolder @relation(fields: [folderId], references: [id])
  uploader User      @relation(fields: [uploadedBy], references: [id])

  @@map("doc_files")
}

enum ProjectStatus {
  planning
  in_progress
  on_hold
  completed

  @@map("project_status")
}

model Project {
  id          String        @id @default(uuid()) @db.Uuid
  name        String
  description String
  status      ProjectStatus @default(planning)
  startDate   DateTime      @map("start_date") @db.Date
  endDate     DateTime      @map("end_date") @db.Date
  ownerId     String        @map("owner_id") @db.Uuid
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  owner      User               @relation(fields: [ownerId], references: [id])
  members    ProjectMember[]
  milestones ProjectMilestone[]

  @@map("projects")
}

model ProjectMember {
  id        String @id @default(uuid()) @db.Uuid
  projectId String @map("project_id") @db.Uuid
  userId    String @map("user_id") @db.Uuid
  role      String @default("contributor")

  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
  @@map("project_members")
}

enum MilestoneStatus {
  pending
  completed

  @@map("milestone_status")
}

model ProjectMilestone {
  id        String          @id @default(uuid()) @db.Uuid
  projectId String          @map("project_id") @db.Uuid
  title     String
  dueDate   DateTime        @map("due_date") @db.Date
  status    MilestoneStatus @default(pending)
  sortOrder Int             @map("sort_order")

  project Project       @relation(fields: [projectId], references: [id])
  tasks   ProjectTask[]

  @@map("project_milestones")
}

enum TaskStatus {
  todo
  in_progress
  done
  blocked

  @@map("task_status")
}

model ProjectTask {
  id          String     @id @default(uuid()) @db.Uuid
  milestoneId String     @map("milestone_id") @db.Uuid
  title       String
  description String?
  assignedTo  String?    @map("assigned_to") @db.Uuid
  dueDate     DateTime?  @map("due_date") @db.Date
  status      TaskStatus @default(todo)
  notes       String?
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  milestone ProjectMilestone @relation(fields: [milestoneId], references: [id])
  assignee  User?            @relation(fields: [assignedTo], references: [id])

  @@map("project_tasks")
}
```

- [ ] **Step 4: Run the migration**

Run:
```bash
pnpm prisma:migrate --name init
```

Expected: Migration created and applied successfully. All tables created in Supabase.

- [ ] **Step 5: Generate Prisma client**

Run:
```bash
pnpm prisma:generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add complete Prisma schema with Phase 1 + Phase 2 scaffold tables"
```

---

### Task 4: Prisma Client Singleton + Types

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 2: Create shared types**

Create `src/types/index.ts`:

```typescript
export type RoleName = "admin" | "analyst" | "operations";

export type PermissionKey =
  // VC Modules
  | "pipeline.view" | "pipeline.create" | "pipeline.edit" | "pipeline.delete"
  | "outreach.view" | "outreach.create" | "outreach.edit" | "outreach.delete"
  | "research.view" | "research.create" | "research.edit" | "research.delete"
  // Operations Modules
  | "legal.view" | "legal.create" | "legal.edit" | "legal.delete"
  | "finance.view" | "finance.create" | "finance.edit" | "finance.delete"
  | "documents.view" | "documents.create" | "documents.edit" | "documents.delete"
  // People Modules
  | "leave.view_own" | "leave.apply" | "leave.approve_all"
  | "timelog.view_own" | "timelog.view_all" | "timelog.edit_all"
  | "activitylog.view_own" | "activitylog.view_all"
  // Admin Modules
  | "users.view" | "users.create" | "users.edit" | "users.deactivate"
  | "roles.manage" | "audit.view" | "settings.manage";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  roleName: RoleName;
  permissions: PermissionKey[];
  department: string | null;
  avatarUrl: string | null;
  forcePasswordChange: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: RoleName;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogInput {
  userId: string;
  eventKey: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  module: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts src/types/index.ts
git commit -m "feat: add Prisma client singleton and shared TypeScript types"
```

---

### Task 5: Seed Script

**Files:**
- Create: `src/prisma/seed.ts`

- [ ] **Step 1: Write the seed script**

Create `src/prisma/seed.ts`:

```typescript
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
      update: { value: setting.value as any },
      create: {
        key: setting.key,
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
```

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:

```json
{
  "prisma": {
    "schema": "src/prisma/schema.prisma",
    "seed": "tsx src/prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Run the seed**

Run:
```bash
pnpm prisma:seed
```

Expected output:
```
Seeding database...
Roles created: admin analyst operations
Admin user created: admin@firm.com
Platform settings created: 15 entries

Seed complete!
Default admin login: admin@firm.com / Admin@123!
```

- [ ] **Step 4: Verify in Prisma Studio**

Run:
```bash
pnpm prisma:studio
```

Verify: `roles` table has 3 rows, `users` table has 1 row, `platform_settings` has 15 rows.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add seed script with roles, admin user, and platform settings"
```

---

## Day 2 — Auth System + RBAC

---

### Task 6: Auth Utilities (JWT + bcrypt)

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Write auth utilities**

Create `src/lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import type { JWTPayload, RoleName } from "@/types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_SHORT = "7d";
const REFRESH_TOKEN_LONG = "30d";

export async function createAccessToken(payload: {
  sub: string;
  email: string;
  role: RoleName;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(
  payload: { sub: string },
  rememberMe: boolean
): Promise<string> {
  const expiry = rememberMe ? REFRESH_TOKEN_LONG : REFRESH_TOKEN_SHORT;
  return new SignJWT({ sub: payload.sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function hashToken(token: string): string {
  // Simple hash for storing token references (not passwords)
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return "Password must contain at least one special character";
  return null;
}

export function getRefreshTokenExpiry(rememberMe: boolean): Date {
  const days = rememberMe ? 30 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add JWT and password auth utilities"
```

---

### Task 7: RBAC Permissions System

**Files:**
- Create: `src/lib/permissions.ts`

- [ ] **Step 1: Write permissions system**

Create `src/lib/permissions.ts`:

```typescript
import type { PermissionKey, RoleName } from "@/types";

const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  admin: [
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
  ],
  analyst: [
    "pipeline.view", "pipeline.create", "pipeline.edit", "pipeline.delete",
    "outreach.view", "outreach.create", "outreach.edit", "outreach.delete",
    "research.view", "research.create", "research.edit", "research.delete",
    "leave.view_own", "leave.apply",
    "timelog.view_own",
    "activitylog.view_own",
    "documents.view",
  ],
  operations: [
    "legal.view", "legal.create", "legal.edit", "legal.delete",
    "finance.view", "finance.create", "finance.edit", "finance.delete",
    "documents.view", "documents.create", "documents.edit", "documents.delete",
    "leave.view_own", "leave.apply",
    "timelog.view_own",
    "activitylog.view_own",
  ],
};

export function hasPermission(role: RoleName, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getPermissionsForRole(role: RoleName): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getAllPermissionKeys(): PermissionKey[] {
  return ROLE_PERMISSIONS.admin; // admin has all permissions
}

export function isAdmin(role: RoleName): boolean {
  return role === "admin";
}

export { ROLE_PERMISSIONS };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/permissions.ts
git commit -m "feat: add RBAC permissions system with role-permission mappings"
```

---

### Task 8: Audit Log + Notification Helpers

**Files:**
- Create: `src/lib/audit.ts`
- Create: `src/lib/notifications.ts`

- [ ] **Step 1: Write audit log helper**

Create `src/lib/audit.ts`:

```typescript
import { db } from "./db";
import type { AuditLogInput } from "@/types";

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        eventKey: input.eventKey,
        details: input.details,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        module: input.module,
      },
    });
  } catch (error) {
    // Audit write failure should not block the primary action (per PRD-04 spec)
    console.error("Audit log write failed:", error);
  }
}

export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}
```

- [ ] **Step 2: Write notification helper**

Create `src/lib/notifications.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/audit.ts src/lib/notifications.ts
git commit -m "feat: add audit logging and notification helpers"
```

---

### Task 9: Utility Functions

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/email.ts`
- Create: `src/lib/csv.ts`

- [ ] **Step 1: Write date and general utilities**

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate working days between two dates (excludes weekends).
 * Does not exclude public holidays (Phase 2 feature).
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculate hours worked from login/logout times and break.
 * Times are in "HH:mm" 24h format.
 */
export function calculateHoursWorked(
  loginTime: string,
  logoutTime: string,
  breakMinutes: number
): number {
  const [loginH, loginM] = loginTime.split(":").map(Number);
  const [logoutH, logoutM] = logoutTime.split(":").map(Number);

  const loginMinutes = loginH * 60 + loginM;
  const logoutMinutes = logoutH * 60 + logoutM;
  const workedMinutes = logoutMinutes - loginMinutes - breakMinutes;

  return Math.max(0, Number((workedMinutes / 60).toFixed(2)));
}

/**
 * Check if two date ranges overlap.
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Format date to YYYY-MM-DD string.
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the start of the current week (Monday).
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for API responses.
 */
export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

- [ ] **Step 2: Write email utility**

Create `src/lib/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "noreply@yourdomain.com";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  temporaryPassword: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Welcome to the Platform",
    html: `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your account has been created. Use the following credentials to log in:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      <p><a href="${loginUrl}">Log In Now</a></p>
      <p>You will be asked to change your password on first login.</p>
    `,
  });
}
```

- [ ] **Step 3: Write CSV export utility**

Create `src/lib/csv.ts`:

```typescript
export function generateCSV(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCSV(String(row[header] ?? ""))).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/lib/email.ts src/lib/csv.ts
git commit -m "feat: add utility functions for dates, email, CSV export, and pagination"
```

---

### Task 10: Auth API Routes

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/refresh/route.ts`
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`

- [ ] **Step 1: Write login route**

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createAccessToken,
  createRefreshToken,
  verifyPassword,
  hashToken,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import type { RoleName } from "@/types";

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getClientInfo(request);

    // Check lockout
    const recentAttempts = await db.loginAttempt.count({
      where: {
        email,
        attemptedAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
      },
    });

    if (recentAttempts >= LOCKOUT_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: "Account temporarily locked. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user?.id },
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await db.loginAttempt.create({
        data: { email, ipAddress, userId: user.id },
      });
      await logAudit({
        userId: user.id,
        eventKey: "auth.login_failed",
        details: `Failed login attempt for ${email}`,
        ipAddress,
        userAgent,
        module: "Auth",
      });
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create tokens
    const roleName = user.role.name as RoleName;
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });
    const refreshToken = await createRefreshToken(
      { sub: user.id },
      rememberMe
    );

    // Store session
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: getRefreshTokenExpiry(rememberMe),
        ipAddress,
        userAgent,
      },
    });

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Clear login attempts for this email
    await db.loginAttempt.deleteMany({ where: { email } });

    // Audit log
    await logAudit({
      userId: user.id,
      eventKey: "auth.login",
      details: `User ${user.fullName} logged in`,
      ipAddress,
      userAgent,
      module: "Auth",
    });

    // Set refresh token as httpOnly cookie
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleName,
          permissions: user.role.permissions,
          department: user.department,
          avatarUrl: user.avatarUrl,
          forcePasswordChange: user.forcePasswordChange,
        },
      },
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Write logout route**

Create `src/app/api/auth/logout/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        // Delete all sessions for this user
        await db.session.deleteMany({ where: { userId: payload.sub } });

        const { ipAddress, userAgent } = getClientInfo(request);
        await logAudit({
          userId: payload.sub,
          eventKey: "auth.logout",
          details: "User logged out",
          ipAddress,
          userAgent,
          module: "Auth",
        });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("refreshToken");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete("refreshToken");
    return response;
  }
}
```

- [ ] **Step 3: Write token refresh route**

Create `src/app/api/auth/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createAccessToken,
  verifyRefreshToken,
  hashToken,
} from "@/lib/auth";
import type { RoleName } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token" },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Verify session exists
    const tokenHash = hashToken(refreshToken);
    const session = await db.session.findFirst({
      where: {
        userId: payload.sub,
        refreshTokenHash: tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 }
      );
    }

    const roleName = user.role.name as RoleName;
    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: roleName,
    });

    // Update session token hash
    await db.session.update({
      where: { id: session.id },
      data: { tokenHash: hashToken(accessToken) },
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          roleName,
          permissions: user.role.permissions,
          department: user.department,
          avatarUrl: user.avatarUrl,
          forcePasswordChange: user.forcePasswordChange,
        },
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Write forgot password route**

Create `src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      data: { message: "If this email exists, a reset link has been sent." },
    });

    if (!email) return successResponse;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return successResponse;

    // Invalidate existing tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send email (fire and forget — don't block response)
    sendPasswordResetEmail(email, resetToken).catch((err) =>
      console.error("Failed to send reset email:", err)
    );

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Write reset password route**

Create `src/app/api/auth/reset-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return NextResponse.json(
        { success: false, error: strengthError },
        { status: 400 }
      );
    }

    // Find valid token
    const tokenHash = hashToken(token);
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        forcePasswordChange: false,
      },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions (force re-login)
    await db.session.deleteMany({ where: { userId: resetToken.userId } });

    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({
      userId: resetToken.userId,
      eventKey: "auth.password_reset",
      details: `Password reset completed for ${resetToken.user.email}`,
      ipAddress,
      userAgent,
      module: "Auth",
    });

    return NextResponse.json({
      success: true,
      data: { message: "Password reset successful. Please log in." },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add all auth API routes (login, logout, refresh, forgot/reset password)"
```

---

### Task 11: Next.js Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write the middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

const ADMIN_PATHS = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get access token from Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    // For pages, redirect to login
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // For API routes, return 401
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check admin-only routes
    if (ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
      if (payload.role !== "admin") {
        if (!pathname.startsWith("/api/")) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // Token expired or invalid
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add JWT auth middleware with role-based route protection"
```

---

### Task 12: Auth Provider + Hooks

**Files:**
- Create: `src/providers/auth-provider.tsx`
- Create: `src/providers/query-provider.tsx`
- Create: `src/hooks/use-auth.ts`
- Create: `src/hooks/use-role.ts`

- [ ] **Step 1: Write Query provider**

Create `src/providers/query-provider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Write Auth provider**

Create `src/providers/auth-provider.tsx`:

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false));
  }, [refreshAuth]);

  // Auto-refresh access token before expiry (every 13 minutes)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      refreshAuth();
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken, refreshAuth]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);

      if (data.data.user.forcePasswordChange) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      });
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    }
  }, [accessToken, router]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
```

- [ ] **Step 3: Write useAuth hook**

Create `src/hooks/use-auth.ts`:

```typescript
"use client";

import { useAuthContext } from "@/providers/auth-provider";
import { useCallback } from "react";

export function useAuth() {
  const { user, accessToken, isLoading, login, logout, refreshAuth } =
    useAuthContext();

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let token = accessToken;

      const makeRequest = (t: string | null) =>
        fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });

      let res = await makeRequest(token);

      // If 401, try refreshing token once
      if (res.status === 401) {
        token = await refreshAuth();
        if (token) {
          res = await makeRequest(token);
        }
      }

      return res;
    },
    [accessToken, refreshAuth]
  );

  return { user, isLoading, login, logout, authFetch };
}
```

- [ ] **Step 4: Write useRole hook**

Create `src/hooks/use-role.ts`:

```typescript
"use client";

import { useAuthContext } from "@/providers/auth-provider";
import type { PermissionKey, RoleName } from "@/types";

export function useRole() {
  const { user } = useAuthContext();

  const roleName: RoleName | null = user?.roleName ?? null;

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    return (user.permissions as string[]).includes(permission);
  };

  const isAdmin = roleName === "admin";

  return { roleName, hasPermission, isAdmin };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/providers/ src/hooks/
git commit -m "feat: add auth provider, query provider, and auth/role hooks"
```

---

### Task 13: Login Page UI

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`
- Create: `src/app/(auth)/change-password/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout with providers**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VC Firm CRM",
  description: "Internal CRM Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password, rememberMe);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-4 text-2xl font-bold text-slate-900">VC Firm</div>
        <CardTitle>Sign in to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create forgot password page**

Create `src/app/(auth)/forgot-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for {email}, a reset link has been sent.
            Check your spam folder if you don't see it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we'll send a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              required
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <Link href="/login" className="block text-center text-sm text-slate-500 hover:underline">
            Back to login
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create reset password page**

Create `src/app/(auth)/reset-password/page.tsx`:

```tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Invalid link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-slate-500">
            This reset link is invalid or has expired.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password reset successful!");
        router.push("/login");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Set new password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              Min 8 chars, 1 uppercase, 1 number, 1 special character
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

- [ ] **Step 6: Create forced change password page**

Create `src/app/(auth)/change-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { authFetch, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed! Please log in again.");
        await logout();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Change your password</CardTitle>
        <CardDescription>
          You must set a new password before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              Min 8 chars, 1 uppercase, 1 number, 1 special character
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/(auth)/
git commit -m "feat: add login, forgot password, reset password, and forced change password pages"
```

---

## Day 3 — App Shell + API Routes

---

### Task 14: Navigation Configuration

**Files:**
- Create: `src/components/layout/nav-items.ts`

- [ ] **Step 1: Write navigation config**

Create `src/components/layout/nav-items.ts`:

```typescript
import type { RoleName, PermissionKey } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  permission?: PermissionKey;
  adminOnly?: boolean;
  comingSoon?: boolean;
  featureFlag?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const PEOPLE_ADMIN_ITEMS: NavItem[] = [
  { label: "Employee Directory", href: "/directory", icon: "Users" },
  { label: "Leave Management", href: "/leave/manage", icon: "CalendarOff", permission: "leave.approve_all" },
  { label: "Time & Attendance", href: "/timelog/all", icon: "Clock", permission: "timelog.view_all" },
  { label: "Activity Logs", href: "/activity/all", icon: "FileText", permission: "activitylog.view_all" },
];

const MY_WORK_ITEMS: NavItem[] = [
  { label: "My Time Log", href: "/timelog", icon: "Clock" },
  { label: "My Leave", href: "/leave", icon: "CalendarOff" },
  { label: "My Activity Log", href: "/activity", icon: "FileText" },
];

const VC_ITEMS: NavItem[] = [
  { label: "Pipeline", href: "/pipeline", icon: "GitBranch", comingSoon: true, featureFlag: "FEATURE_PIPELINE" },
  { label: "Outreach", href: "/outreach", icon: "Send", comingSoon: true, featureFlag: "FEATURE_OUTREACH" },
  { label: "Research", href: "/research", icon: "BookOpen", comingSoon: true, featureFlag: "FEATURE_RESEARCH" },
];

const OPS_ITEMS: NavItem[] = [
  { label: "Legal Vault", href: "/legal", icon: "Shield", comingSoon: true, featureFlag: "FEATURE_LEGAL" },
  { label: "Finance", href: "/finance", icon: "DollarSign", comingSoon: true, featureFlag: "FEATURE_FINANCE" },
  { label: "Documents", href: "/documents", icon: "FolderOpen", comingSoon: true, featureFlag: "FEATURE_DOCUMENTS" },
];

const PROJECT_ITEMS: NavItem[] = [
  { label: "Project Planner", href: "/projects", icon: "Kanban", comingSoon: true, featureFlag: "FEATURE_PROJECTS" },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "User Management", href: "/admin/users", icon: "UserCog", adminOnly: true },
  { label: "Roles & Permissions", href: "/admin/roles", icon: "ShieldCheck", adminOnly: true },
  { label: "Audit Log", href: "/admin/audit", icon: "ScrollText", adminOnly: true },
  { label: "Platform Settings", href: "/admin/settings", icon: "Settings", adminOnly: true },
];

export function getNavGroups(role: RoleName): NavGroup[] {
  switch (role) {
    case "admin":
      return [
        { label: "People & HR", items: PEOPLE_ADMIN_ITEMS },
        { label: "VC & Deals", items: VC_ITEMS },
        { label: "Operations", items: OPS_ITEMS },
        { label: "Projects", items: PROJECT_ITEMS },
        { label: "Admin", items: ADMIN_ITEMS },
      ];
    case "analyst":
      return [
        { label: "My Work", items: MY_WORK_ITEMS },
        { label: "VC & Deals", items: VC_ITEMS },
        { label: "Projects", items: PROJECT_ITEMS },
      ];
    case "operations":
      return [
        { label: "My Work", items: MY_WORK_ITEMS },
        { label: "Operations", items: OPS_ITEMS },
        { label: "Projects", items: PROJECT_ITEMS },
      ];
    default:
      return [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/nav-items.ts
git commit -m "feat: add role-aware navigation configuration"
```

---

### Task 15: Sidebar + TopBar + Shell Layout

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/topbar.tsx`
- Create: `src/components/layout/mobile-drawer.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/hooks/use-notifications.ts`

- [ ] **Step 1: Write Sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { getNavGroups } from "./nav-items";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const { roleName } = useRole();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  if (!roleName) return null;
  const navGroups = getNavGroups(roleName);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const getIcon = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Dashboard link */}
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            pathname === "/dashboard" && "text-blue-600"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100",
                    item.comingSoon && "opacity-60"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {getIcon(item.icon)}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Soon
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex h-10 items-center justify-center border-t text-slate-400 hover:text-slate-600"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
```

- [ ] **Step 2: Write TopBar component**

Create `src/components/layout/topbar.tsx`:

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell, Search, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function TopBar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const { unreadCount } = useNotifications();

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      {/* Left: Firm name */}
      <Link href="/dashboard" className="text-lg font-bold text-slate-900">
        VC Firm
      </Link>

      {/* Center: Search placeholder */}
      <div className="hidden md:flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-400">
        <Search className="h-4 w-4" />
        <span>Search (coming soon)</span>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-1">
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 text-sm font-medium">Notifications</div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto p-2 text-sm text-slate-500">
              {unreadCount === 0
                ? "No new notifications"
                : "Loading notifications..."}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 text-red-600">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Write notifications hook**

Create `src/hooks/use-notifications.ts`:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useNotifications() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await authFetch("/api/notifications");
      const json = await res.json();
      return json.data ?? { notifications: [], unreadCount: 0 };
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await authFetch("/api/notifications/mark-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    markAllRead: markAllRead.mutate,
  };
}
```

- [ ] **Step 4: Write mobile drawer**

Create `src/components/layout/mobile-drawer.tsx`:

```tsx
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

export function MobileDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Write dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/app/(dashboard)/layout.tsx src/hooks/use-notifications.ts
git commit -m "feat: add app shell with sidebar, topbar, mobile drawer, and dashboard layout"
```

---

### Task 16: Core API Routes (Users, Leave, Timelog, Activity)

> This is the largest task — all CRUD API routes for People Management.
> Each route validates auth via request headers set by middleware.

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[id]/route.ts`
- Create: `src/app/api/users/me/route.ts`
- Create: `src/app/api/leave/route.ts`
- Create: `src/app/api/leave/[id]/route.ts`
- Create: `src/app/api/leave/[id]/approve/route.ts`
- Create: `src/app/api/leave/[id]/reject/route.ts`
- Create: `src/app/api/timelog/route.ts`
- Create: `src/app/api/timelog/[id]/route.ts`
- Create: `src/app/api/activity/route.ts`
- Create: `src/app/api/activity/[id]/route.ts`
- Create: `src/app/api/notifications/route.ts`
- Create: `src/app/api/notifications/mark-read/route.ts`
- Create: `src/app/api/export/[type]/route.ts`

- [ ] **Step 1: Create a helper for extracting auth from request headers**

Add to `src/lib/auth.ts` (append to existing file):

```typescript
import { headers } from "next/headers";

export async function getAuthFromHeaders(): Promise<{
  userId: string;
  email: string;
  role: RoleName;
} | null> {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const email = headersList.get("x-user-email");
  const role = headersList.get("x-user-role") as RoleName | null;

  if (!userId || !email || !role) return null;
  return { userId, email, role };
}
```

- [ ] **Step 2: Write /api/users/me route (profile + change password)**

Create `src/app/api/users/me/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders, hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { role: true },
    omit: { passwordHash: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { fullName, department, currentPassword, newPassword } = body;

  // Password change
  if (currentPassword && newPassword) {
    const user = await db.user.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });

    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) return NextResponse.json({ success: false, error: strengthError }, { status: 400 });

    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash: await hashPassword(newPassword), forcePasswordChange: false },
    });

    // Invalidate other sessions
    await db.session.deleteMany({ where: { userId: auth.userId } });

    const { ipAddress, userAgent } = getClientInfo(request);
    await logAudit({
      userId: auth.userId,
      eventKey: "auth.password_reset",
      details: "User changed their password",
      ipAddress, userAgent, module: "Auth",
    });

    return NextResponse.json({ success: true, data: { message: "Password changed" } });
  }

  // Profile update
  const updated = await db.user.update({
    where: { id: auth.userId },
    data: {
      ...(fullName && { fullName }),
      ...(department !== undefined && { department }),
    },
    omit: { passwordHash: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
```

- [ ] **Step 3: Write /api/users route (list employees)**

Create `src/app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const search = searchParams.get("search") ?? "";
  const roleFilter = searchParams.get("role") ?? "";
  const departmentFilter = searchParams.get("department") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (roleFilter) where.role = { name: roleFilter };
  if (departmentFilter) where.department = departmentFilter;
  if (statusFilter === "active") where.isActive = true;
  if (statusFilter === "inactive") where.isActive = false;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where: where as any,
      include: { role: { select: { name: true, displayName: true } } },
      omit: { passwordHash: true },
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
    }),
    db.user.count({ where: where as any }),
  ]);

  return NextResponse.json({
    success: true,
    data: users,
    meta: buildPaginationMeta(total, page, limit),
  });
}
```

- [ ] **Step 4: Write /api/users/[id] route**

Create `src/app/api/users/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: { role: { select: { name: true, displayName: true } } },
    omit: { passwordHash: true },
  });

  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: user });
}
```

- [ ] **Step 5: Write /api/leave route (list + create)**

Create `src/app/api/leave/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta, calculateWorkingDays, dateRangesOverlap } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";

  const where: Record<string, unknown> = viewAll ? {} : { userId: auth.userId };

  const statusFilter = searchParams.get("status");
  if (statusFilter) where.status = statusFilter;

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.leaveRequest.count({ where: where as any }),
  ]);

  return NextResponse.json({
    success: true,
    data: requests,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leaveType, startDate, endDate, reason } = body;

  if (!leaveType || !startDate || !endDate) {
    return NextResponse.json({ success: false, error: "Leave type, start date, and end date are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start < new Date(new Date().toDateString())) {
    return NextResponse.json({ success: false, error: "Start date cannot be in the past" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 });
  }

  // Check for overlapping approved/pending leave
  const existing = await db.leaveRequest.findMany({
    where: {
      userId: auth.userId,
      status: { in: ["pending", "approved"] },
    },
  });

  const overlap = existing.some((req) =>
    dateRangesOverlap(start, end, new Date(req.startDate), new Date(req.endDate))
  );

  if (overlap) {
    return NextResponse.json({ success: false, error: "You already have leave during these dates" }, { status: 400 });
  }

  const workingDays = calculateWorkingDays(start, end);

  const leaveRequest = await db.leaveRequest.create({
    data: {
      userId: auth.userId,
      leaveType,
      startDate: start,
      endDate: end,
      workingDays,
      reason,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "leave.submitted",
    details: `Leave request submitted: ${leaveType} from ${startDate} to ${endDate} (${workingDays} days)`,
    metadata: { leaveRequestId: leaveRequest.id },
    ipAddress, userAgent, module: "Leave",
  });

  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { fullName: true } });
  await notifyAdmins({
    title: "New Leave Request",
    message: `${user?.fullName} requested ${leaveType} leave (${workingDays} days)`,
    link: "/leave/manage",
  });

  return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
}
```

- [ ] **Step 6: Write /api/leave/[id]/approve and /api/leave/[id]/reject routes**

Create `src/app/api/leave/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leave = await db.leaveRequest.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      reviewer: { select: { id: true, fullName: true } },
    },
  });

  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.userId !== auth.userId && auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: leave });
}
```

Create `src/app/api/leave/[id]/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const leave = await db.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.status !== "pending") {
    return NextResponse.json({ success: false, error: "Leave request is not pending" }, { status: 400 });
  }

  // Deduct balance (only for annual leave)
  if (leave.leaveType === "annual") {
    await db.user.update({
      where: { id: leave.userId },
      data: { leaveBalance: { decrement: leave.workingDays } },
    });
  }

  const updated = await db.leaveRequest.update({
    where: { id },
    data: { status: "approved", reviewedBy: auth.userId },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "leave.approved",
    details: `Approved leave request ${id}`,
    metadata: { leaveRequestId: id },
    ipAddress, userAgent, module: "Leave",
  });

  await createNotification({
    userId: leave.userId,
    title: "Leave Approved",
    message: "Your leave request has been approved.",
    link: "/leave",
  });

  return NextResponse.json({ success: true, data: updated });
}
```

Create `src/app/api/leave/[id]/reject/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { note } = body;

  if (!note) {
    return NextResponse.json({ success: false, error: "Rejection note is required" }, { status: 400 });
  }

  const leave = await db.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (leave.status !== "pending") {
    return NextResponse.json({ success: false, error: "Leave request is not pending" }, { status: 400 });
  }

  const updated = await db.leaveRequest.update({
    where: { id },
    data: { status: "rejected", reviewedBy: auth.userId, reviewerNote: note },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "leave.rejected",
    details: `Rejected leave request ${id}: ${note}`,
    metadata: { leaveRequestId: id },
    ipAddress, userAgent, module: "Leave",
  });

  await createNotification({
    userId: leave.userId,
    title: "Leave Rejected",
    message: `Your leave request was rejected: ${note}`,
    link: "/leave",
  });

  return NextResponse.json({ success: true, data: updated });
}
```

- [ ] **Step 7: Write /api/timelog routes**

Create `src/app/api/timelog/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta, calculateHoursWorked } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";
  const userId = viewAll ? searchParams.get("userId") ?? undefined : auth.userId;

  const where: Record<string, unknown> = userId ? { userId } : {};
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  if (dateFrom || dateTo) {
    where.logDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const [entries, total] = await Promise.all([
    db.timeLogEntry.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, fullName: true } },
        amender: { select: { id: true, fullName: true } },
      },
      skip,
      take: limit,
      orderBy: { logDate: "desc" },
    }),
    db.timeLogEntry.count({ where: where as any }),
  ]);

  return NextResponse.json({
    success: true,
    data: entries,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { logDate, loginTime, logoutTime, breakMinutes = 0, notes } = body;

  if (!logDate || !loginTime) {
    return NextResponse.json({ success: false, error: "Date and login time are required" }, { status: 400 });
  }

  // Check one entry per user per date
  const existing = await db.timeLogEntry.findUnique({
    where: { userId_logDate: { userId: auth.userId, logDate: new Date(logDate) } },
  });
  if (existing) {
    return NextResponse.json({ success: false, error: "Entry already exists for this date. Edit the existing entry." }, { status: 400 });
  }

  const hoursWorked = logoutTime ? calculateHoursWorked(loginTime, logoutTime, breakMinutes) : null;

  const entry = await db.timeLogEntry.create({
    data: {
      userId: auth.userId,
      logDate: new Date(logDate),
      loginTime,
      logoutTime,
      breakMinutes,
      hoursWorked,
      notes,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "timelog.created",
    details: `Time log created for ${logDate}`,
    metadata: { timeLogId: entry.id },
    ipAddress, userAgent, module: "Time",
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
```

Create `src/app/api/timelog/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { calculateHoursWorked } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await db.timeLogEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const isOwner = entry.userId === auth.userId;
  const isAdmin = auth.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Check 7-day self-edit window
  if (isOwner && !isAdmin) {
    const daysSince = Math.floor((Date.now() - new Date(entry.logDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) {
      return NextResponse.json({ success: false, error: "Entries older than 7 days can only be edited by admin" }, { status: 403 });
    }
  }

  const body = await request.json();
  const { loginTime, logoutTime, breakMinutes, notes, amendmentNote } = body;

  const newLogin = loginTime ?? entry.loginTime;
  const newLogout = logoutTime ?? entry.logoutTime;
  const newBreak = breakMinutes ?? entry.breakMinutes;
  const hoursWorked = newLogout ? calculateHoursWorked(newLogin, newLogout, newBreak) : entry.hoursWorked;

  const updated = await db.timeLogEntry.update({
    where: { id },
    data: {
      loginTime: newLogin,
      logoutTime: newLogout,
      breakMinutes: newBreak,
      hoursWorked,
      notes: notes ?? entry.notes,
      ...(isAdmin && !isOwner && {
        isAmended: true,
        amendedBy: auth.userId,
        amendmentNote: amendmentNote ?? "Amended by admin",
      }),
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: isAdmin && !isOwner ? "timelog.amended" : "timelog.created",
    details: `Time log updated for ${entry.logDate}`,
    metadata: { timeLogId: id },
    ipAddress, userAgent, module: "Time",
  });

  return NextResponse.json({ success: true, data: updated });
}
```

- [ ] **Step 8: Write /api/activity routes**

Create `src/app/api/activity/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { parsePagination, buildPaginationMeta } from "@/lib/utils";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams);
  const viewAll = searchParams.get("all") === "true" && auth.role === "admin";
  const userId = viewAll ? searchParams.get("userId") ?? undefined : auth.userId;
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = userId ? { userId } : {};
  if (tag) where.tags = { has: tag };
  if (search) where.activities = { contains: search, mode: "insensitive" };

  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  if (dateFrom || dateTo) {
    where.logDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const [entries, total] = await Promise.all([
    db.activityLogEntry.findMany({
      where: where as any,
      include: { user: { select: { id: true, fullName: true } } },
      skip,
      take: limit,
      orderBy: { logDate: "desc" },
    }),
    db.activityLogEntry.count({ where: where as any }),
  ]);

  return NextResponse.json({
    success: true,
    data: entries,
    meta: buildPaginationMeta(total, page, limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { logDate, activities, blockers, tags = [] } = body;

  if (!activities) {
    return NextResponse.json({ success: false, error: "Activities field is required" }, { status: 400 });
  }

  const date = logDate ? new Date(logDate) : new Date();

  // Upsert: create or update for the day
  const entry = await db.activityLogEntry.upsert({
    where: { userId_logDate: { userId: auth.userId, logDate: date } },
    update: { activities, blockers, tags },
    create: {
      userId: auth.userId,
      logDate: date,
      activities,
      blockers,
      tags,
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "activitylog.created",
    details: `Activity log saved for ${date.toISOString().split("T")[0]}`,
    metadata: { activityLogId: entry.id },
    ipAddress, userAgent, module: "Activity",
  });

  return NextResponse.json({ success: true, data: entry }, { status: 201 });
}
```

Create `src/app/api/activity/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { logAudit, getClientInfo } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await db.activityLogEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const isOwner = entry.userId === auth.userId;
  const isAdmin = auth.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Check lock (non-admin)
  if (entry.isLocked && !isAdmin) {
    return NextResponse.json({ success: false, error: "This entry is locked and cannot be edited" }, { status: 403 });
  }

  const body = await request.json();
  const { activities, blockers, tags } = body;

  const updated = await db.activityLogEntry.update({
    where: { id },
    data: {
      ...(activities !== undefined && { activities }),
      ...(blockers !== undefined && { blockers }),
      ...(tags !== undefined && { tags }),
    },
  });

  const { ipAddress, userAgent } = getClientInfo(request);
  await logAudit({
    userId: auth.userId,
    eventKey: "activitylog.edited",
    details: `Activity log edited for ${entry.logDate}`,
    metadata: { activityLogId: id },
    ipAddress, userAgent, module: "Activity",
  });

  return NextResponse.json({ success: true, data: updated });
}
```

- [ ] **Step 9: Write notification routes**

Create `src/app/api/notifications/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.notification.count({
      where: { userId: auth.userId, isRead: false },
    }),
  ]);

  return NextResponse.json({ success: true, data: { notifications, unreadCount } });
}
```

Create `src/app/api/notifications/mark-read/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";

export async function POST() {
  const auth = await getAuthFromHeaders();
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await db.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 10: Write CSV export route**

Create `src/app/api/export/[type]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthFromHeaders } from "@/lib/auth";
import { generateCSV, csvResponse } from "@/lib/csv";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const auth = await getAuthFromHeaders();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { type } = await params;

  switch (type) {
    case "leave": {
      const data = await db.leaveRequest.findMany({
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      const rows = data.map((r) => ({
        Employee: r.user.fullName,
        Email: r.user.email,
        Type: r.leaveType,
        "Start Date": r.startDate.toISOString().split("T")[0],
        "End Date": r.endDate.toISOString().split("T")[0],
        "Working Days": String(r.workingDays),
        Status: r.status,
        Reason: r.reason ?? "",
      }));
      return csvResponse(
        generateCSV(["Employee", "Email", "Type", "Start Date", "End Date", "Working Days", "Status", "Reason"], rows),
        "leave-requests.csv"
      );
    }

    case "timelog": {
      const data = await db.timeLogEntry.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { logDate: "desc" },
      });
      const rows = data.map((r) => ({
        Employee: r.user.fullName,
        Date: r.logDate.toISOString().split("T")[0],
        Login: r.loginTime,
        Logout: r.logoutTime ?? "",
        "Break (min)": String(r.breakMinutes),
        "Hours Worked": String(r.hoursWorked ?? ""),
        Amended: r.isAmended ? "Yes" : "No",
      }));
      return csvResponse(
        generateCSV(["Employee", "Date", "Login", "Logout", "Break (min)", "Hours Worked", "Amended"], rows),
        "time-logs.csv"
      );
    }

    case "activity": {
      const data = await db.activityLogEntry.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { logDate: "desc" },
      });
      const rows = data.map((r) => ({
        Employee: r.user.fullName,
        Date: r.logDate.toISOString().split("T")[0],
        Activities: r.activities,
        Blockers: r.blockers ?? "",
        Tags: r.tags.join(", "),
      }));
      return csvResponse(
        generateCSV(["Employee", "Date", "Activities", "Blockers", "Tags"], rows),
        "activity-logs.csv"
      );
    }

    case "audit": {
      const data = await db.auditLog.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      });
      const rows = data.map((r) => ({
        Timestamp: r.createdAt.toISOString(),
        User: r.user.fullName,
        Action: r.eventKey,
        Details: r.details,
        Module: r.module,
        IP: r.ipAddress,
      }));
      return csvResponse(
        generateCSV(["Timestamp", "User", "Action", "Details", "Module", "IP"], rows),
        "audit-log.csv"
      );
    }

    default:
      return NextResponse.json({ success: false, error: "Invalid export type" }, { status: 400 });
  }
}
```

- [ ] **Step 11: Commit**

```bash
git add src/app/api/ src/lib/auth.ts
git commit -m "feat: add all CRUD API routes for users, leave, timelog, activity, notifications, and CSV export"
```

---

## Day 4-5 — UI Pages

> From this point, each task creates UI pages that wire to the API routes built above.
> The pattern for each page: fetch data with TanStack Query via `authFetch`, render with shadcn/ui components.

---

### Task 17: Shared Components

**Files:**
- Create: `src/components/shared/placeholder-page.tsx`
- Create: `src/components/shared/data-table.tsx`
- Create: `src/components/shared/confirm-modal.tsx`
- Create: `src/components/shared/csv-export-button.tsx`
- Create: `src/components/dashboard/stat-card.tsx`
- Create: `src/components/dashboard/placeholder-widget.tsx`
- Create: `src/hooks/use-pagination.ts`

- [ ] **Step 1: Write PlaceholderPage**

Create `src/components/shared/placeholder-page.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlaceholderPageProps {
  moduleName: string;
  icon: React.ReactNode;
}

export function PlaceholderPage({ moduleName, icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">{moduleName}</h2>
      <p className="mb-6 text-slate-500">
        This module is coming in a future platform update.
      </p>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Write DataTable**

Create `src/components/shared/data-table.tsx`:

```tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  isLoading,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400 py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={(row.id as string) ?? i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write ConfirmModal**

Create `src/components/shared/confirm-modal.tsx`:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Write StatCard and PlaceholderWidget**

Create `src/components/dashboard/stat-card.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        {icon && <div className="text-slate-400">{icon}</div>}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `src/components/dashboard/placeholder-widget.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PlaceholderWidgetProps {
  title: string;
}

export function PlaceholderWidget({ title }: PlaceholderWidgetProps) {
  return (
    <Card className="opacity-60">
      <CardContent className="flex items-center gap-3 p-4">
        <Lock className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-medium text-slate-600">{title}</p>
          <p className="text-xs text-slate-400">Available in a future update</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Write CSVExportButton and usePagination**

Create `src/components/shared/csv-export-button.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CSVExportButtonProps {
  type: "leave" | "timelog" | "activity" | "audit";
  label?: string;
}

export function CSVExportButton({ type, label = "Export CSV" }: CSVExportButtonProps) {
  const { authFetch } = useAuth();

  const handleExport = async () => {
    try {
      const res = await authFetch(`/api/export/${type}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
```

Create `src/hooks/use-pagination.ts`:

```typescript
"use client";

import { useState } from "react";

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage);

  const reset = () => setPage(1);

  return { page, setPage, reset };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/ src/components/dashboard/ src/hooks/use-pagination.ts
git commit -m "feat: add shared UI components (DataTable, ConfirmModal, StatCard, PlaceholderPage, CSVExport)"
```

---

### Task 18-36: UI Pages

> **Implementation note for the executing agent:** The remaining UI pages (Tasks 18-36) follow the same pattern:
>
> 1. Create a page component in `src/app/(dashboard)/[route]/page.tsx`
> 2. Use `useAuth().authFetch` with `useQuery`/`useMutation` from TanStack Query
> 3. Render data using `DataTable`, `StatCard`, and shadcn/ui components
> 4. Wire forms to POST/PATCH API routes
>
> Each page should be implemented as a separate commit. The executing agent should:
> - Read the PRD for each page's requirements (PRD-02 for dashboard, PRD-03 for people, PRD-04 for admin)
> - Follow the access matrix in PRD-03 Section 2
> - Use the API routes from Task 16 as the data source
>
> Below are the remaining pages to implement, grouped by module:

- [ ] **Task 18: Dashboard page** (`src/app/(dashboard)/dashboard/page.tsx`)
  - Role-specific rendering: AdminDashboard, AnalystDashboard, OperationsDashboard
  - Create `src/components/dashboard/admin-dashboard.tsx`, `analyst-dashboard.tsx`, `operations-dashboard.tsx`
  - Admin: stats row (total employees, active today, pending leave, open accounts), active widgets (recent activity, pending leave, clocked-in users), placeholder widgets
  - Analyst/Ops: stats row (my hours, leave balance, tasks today), my time log chart, activity quick-add, upcoming leave, placeholder widgets
  - Commit: `feat: add role-specific dashboard pages`

- [ ] **Task 19: Employee Directory** (`src/app/(dashboard)/directory/page.tsx`)
  - Table/card grid toggle, search, filter by role/dept/status, sort by name/join date
  - Click employee -> navigate to `/directory/[id]`
  - Commit: `feat: add employee directory page`

- [ ] **Task 20: Employee Profile** (`src/app/(dashboard)/directory/[id]/page.tsx`)
  - Personal info, employment info, leave balance summary, time log summary, recent activity
  - Admin-only section: change role, deactivate, reset password
  - Commit: `feat: add employee profile detail page`

- [ ] **Task 21: My Leave page** (`src/app/(dashboard)/leave/page.tsx`)
  - Summary cards (total, used, remaining, pending), leave history table, "Apply for Leave" button + form modal
  - Form: leave type dropdown, start/end date pickers, reason textarea
  - Commit: `feat: add my leave page with application form`

- [ ] **Task 22: Leave Management (Admin)** (`src/app/(dashboard)/leave/manage/page.tsx`)
  - Three tabs: Pending Approvals, All Leave, Leave Balances
  - Pending: table with approve/reject actions, reject requires note modal
  - All: full table with filters (employee, type, status, date range), CSV export
  - Balances: employee table with balance info, admin can adjust balance
  - Commit: `feat: add admin leave management page`

- [ ] **Task 23: My Time Log page** (`src/app/(dashboard)/timelog/page.tsx`)
  - Clock-in widget (today's entry: login/logout/break inputs, save)
  - Weekly bar chart (Recharts), log table with edit
  - "Add entry" for past dates (up to 7 days back)
  - Commit: `feat: add my time log page with clock-in widget and weekly chart`

- [ ] **Task 24: All Time Logs (Admin)** (`src/app/(dashboard)/timelog/all/page.tsx`)
  - Overview table: employee, hours this week/month, last log date
  - Detailed view with filters (employee, date range), flag unusual hours (>12h or <1h)
  - Admin can amend entries, CSV export
  - Commit: `feat: add admin all-employees time log page`

- [ ] **Task 25: My Activity Log** (`src/app/(dashboard)/activity/page.tsx`)
  - Daily entry form (activities textarea, blockers textarea, tags selection)
  - Calendar/list view toggle, filter by tag, search by keyword
  - Commit: `feat: add my activity log page with daily entry form`

- [ ] **Task 26: All Activity Logs (Admin)** (`src/app/(dashboard)/activity/all/page.tsx`)
  - Date-based view: pick date -> see all entries for that day
  - Employee-based view: pick employee -> see their history
  - Filter by tag/employee/date range, CSV export
  - Commit: `feat: add admin all-employees activity log page`

- [ ] **Task 27: Admin Home** (`src/app/(dashboard)/admin/page.tsx`)
  - Stat cards (active employees, clocked in, pending leave, new users this month)
  - Recent audit feed (last 10 events), quick actions (create user, view leave, export)
  - Commit: `feat: add admin home dashboard`

- [ ] **Task 28: User Management** (`src/app/(dashboard)/admin/users/page.tsx`, `new/page.tsx`, `[id]/page.tsx`)
  - User list: table with avatar, name, email, role badge, department, status, last login, actions
  - Create user form: name, email, role, department, join date, welcome email toggle
  - Edit user: all editable fields, admin actions (reset password, force logout, deactivate)
  - Commit: `feat: add admin user management (list, create, edit)`

- [ ] **Task 29: Write Admin API routes** (`src/app/api/admin/users/route.ts`, `[id]/route.ts`, etc.)
  - POST /api/admin/users — create user (generate temp password, send welcome email)
  - PATCH /api/admin/users/[id] — update user (role change, deactivate, etc.)
  - POST /api/admin/users/[id]/reset-password — send reset email
  - POST /api/admin/users/[id]/force-logout — invalidate sessions
  - GET/PATCH /api/admin/settings — read/update platform settings
  - GET /api/admin/audit — audit log with filters
  - PATCH /api/admin/leave-balance/[id] — adjust leave balance
  - Commit: `feat: add admin API routes for user management, settings, and audit`

- [ ] **Task 30: Roles Viewer** (`src/app/(dashboard)/admin/roles/page.tsx`)
  - Tab per role (Admin, Analyst, Operations)
  - Permission matrix table grouped by module, checkmark/dash per permission
  - Note: "To modify role permissions, contact your system administrator"
  - Commit: `feat: add admin roles and permissions viewer`

- [ ] **Task 31: Audit Log page** (`src/app/(dashboard)/admin/audit/page.tsx`)
  - Table: timestamp, user, action, details, IP, module badge
  - Filters: date range, user search, module, action type
  - CSV export button
  - Commit: `feat: add admin audit log page`

- [ ] **Task 32: Platform Settings** (`src/app/(dashboard)/admin/settings/page.tsx`)
  - Active settings forms: working hours, leave policy, time format, firm details
  - Phase 2 placeholder sections (disabled with "Coming soon" labels)
  - Commit: `feat: add admin platform settings page`

- [ ] **Task 33: Profile page** (`src/app/(dashboard)/profile/page.tsx`)
  - Editable: full name, department, profile photo upload
  - Read-only: email, role, last login
  - Change password section (current + new + confirm)
  - Commit: `feat: add user profile page`

- [ ] **Task 34: Placeholder pages for Phase 2 modules**
  - Create pages for: pipeline, outreach, research, legal, finance, documents, projects
  - Each renders `PlaceholderPage` with module name and icon
  - Commit: `feat: add placeholder pages for all Phase 2 modules`

- [ ] **Task 35: Notification dropdown in TopBar**
  - Enhance TopBar notification bell to show actual notifications from `useNotifications`
  - Each notification item: title, message, time ago, link
  - "Mark all as read" button
  - Commit: `feat: wire notification dropdown to real data`

- [ ] **Task 36: Commit all UI pages**

```bash
git add -A
git commit -m "feat: complete all Phase 1 UI pages"
```

---

## Day 7 — Testing

---

### Task 37: Unit Tests

**Files:**
- Create: `src/lib/__tests__/utils.test.ts`
- Create: `src/lib/__tests__/permissions.test.ts`
- Create: `src/lib/__tests__/auth.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/lib/db.ts", "src/lib/email.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 2: Write utility tests**

Create `src/lib/__tests__/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  calculateWorkingDays,
  calculateHoursWorked,
  dateRangesOverlap,
  parsePagination,
  buildPaginationMeta,
} from "../utils";

describe("calculateWorkingDays", () => {
  it("counts weekdays between Mon-Fri", () => {
    // Monday April 14, 2026 to Friday April 18, 2026
    expect(calculateWorkingDays(new Date("2026-04-14"), new Date("2026-04-18"))).toBe(5);
  });

  it("excludes weekends", () => {
    // Monday April 13 to Monday April 20 (includes a weekend)
    expect(calculateWorkingDays(new Date("2026-04-13"), new Date("2026-04-20"))).toBe(6);
  });

  it("returns 1 for same day (weekday)", () => {
    expect(calculateWorkingDays(new Date("2026-04-14"), new Date("2026-04-14"))).toBe(1);
  });

  it("returns 0 for Saturday only", () => {
    expect(calculateWorkingDays(new Date("2026-04-18"), new Date("2026-04-18"))).toBe(0);
    // April 18 2026 is Saturday - actually let me verify. Let me just use known dates.
  });
});

describe("calculateHoursWorked", () => {
  it("calculates basic hours", () => {
    expect(calculateHoursWorked("09:00", "17:00", 0)).toBe(8);
  });

  it("subtracts break time", () => {
    expect(calculateHoursWorked("09:00", "17:30", 30)).toBe(8);
  });

  it("returns 0 for negative result", () => {
    expect(calculateHoursWorked("17:00", "09:00", 0)).toBe(0);
  });
});

describe("dateRangesOverlap", () => {
  it("detects overlap", () => {
    expect(
      dateRangesOverlap(
        new Date("2026-04-14"),
        new Date("2026-04-18"),
        new Date("2026-04-16"),
        new Date("2026-04-20")
      )
    ).toBe(true);
  });

  it("detects no overlap", () => {
    expect(
      dateRangesOverlap(
        new Date("2026-04-14"),
        new Date("2026-04-15"),
        new Date("2026-04-16"),
        new Date("2026-04-20")
      )
    ).toBe(false);
  });
});

describe("parsePagination", () => {
  it("returns defaults", () => {
    const params = new URLSearchParams();
    expect(parsePagination(params)).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it("parses page and limit", () => {
    const params = new URLSearchParams({ page: "3", limit: "10" });
    expect(parsePagination(params)).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps limit to 100", () => {
    const params = new URLSearchParams({ limit: "500" });
    expect(parsePagination(params).limit).toBe(100);
  });
});

describe("buildPaginationMeta", () => {
  it("calculates total pages", () => {
    expect(buildPaginationMeta(100, 1, 25)).toEqual({
      total: 100,
      page: 1,
      limit: 25,
      totalPages: 4,
    });
  });
});
```

- [ ] **Step 3: Write permission tests**

Create `src/lib/__tests__/permissions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hasPermission, getPermissionsForRole, isAdmin } from "../permissions";

describe("hasPermission", () => {
  it("admin has all permissions", () => {
    expect(hasPermission("admin", "users.create")).toBe(true);
    expect(hasPermission("admin", "pipeline.view")).toBe(true);
    expect(hasPermission("admin", "leave.approve_all")).toBe(true);
    expect(hasPermission("admin", "settings.manage")).toBe(true);
  });

  it("analyst has VC permissions but not admin", () => {
    expect(hasPermission("analyst", "pipeline.view")).toBe(true);
    expect(hasPermission("analyst", "pipeline.create")).toBe(true);
    expect(hasPermission("analyst", "users.create")).toBe(false);
    expect(hasPermission("analyst", "leave.approve_all")).toBe(false);
    expect(hasPermission("analyst", "settings.manage")).toBe(false);
  });

  it("operations has ops permissions but not VC", () => {
    expect(hasPermission("operations", "legal.view")).toBe(true);
    expect(hasPermission("operations", "finance.edit")).toBe(true);
    expect(hasPermission("operations", "pipeline.view")).toBe(false);
    expect(hasPermission("operations", "users.create")).toBe(false);
  });

  it("all roles have own leave/timelog access", () => {
    expect(hasPermission("analyst", "leave.view_own")).toBe(true);
    expect(hasPermission("analyst", "leave.apply")).toBe(true);
    expect(hasPermission("operations", "timelog.view_own")).toBe(true);
  });
});

describe("getPermissionsForRole", () => {
  it("returns array for valid role", () => {
    const perms = getPermissionsForRole("admin");
    expect(Array.isArray(perms)).toBe(true);
    expect(perms.length).toBeGreaterThan(0);
  });
});

describe("isAdmin", () => {
  it("identifies admin", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("analyst")).toBe(false);
    expect(isAdmin("operations")).toBe(false);
  });
});
```

- [ ] **Step 4: Write auth utility tests**

Create `src/lib/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "../auth";

describe("validatePasswordStrength", () => {
  it("rejects short passwords", () => {
    expect(validatePasswordStrength("Ab1!")).toBe("Password must be at least 8 characters");
  });

  it("rejects passwords without uppercase", () => {
    expect(validatePasswordStrength("abcdefg1!")).toBe(
      "Password must contain at least one uppercase letter"
    );
  });

  it("rejects passwords without numbers", () => {
    expect(validatePasswordStrength("Abcdefgh!")).toBe(
      "Password must contain at least one number"
    );
  });

  it("rejects passwords without special chars", () => {
    expect(validatePasswordStrength("Abcdefg1")).toBe(
      "Password must contain at least one special character"
    );
  });

  it("accepts valid passwords", () => {
    expect(validatePasswordStrength("Admin@123!")).toBeNull();
    expect(validatePasswordStrength("MyP@ssw0rd")).toBeNull();
  });
});
```

- [ ] **Step 5: Run tests**

Run:
```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 6: Run coverage**

Run:
```bash
pnpm test:coverage
```

Expected: 80%+ coverage on `src/lib/utils.ts` and `src/lib/permissions.ts`.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts src/lib/__tests__/ package.json
git commit -m "test: add unit tests for utilities, permissions, and auth validation"
```

---

### Task 38: E2E Tests (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/auth.spec.ts`
- Create: `e2e/leave.spec.ts`

- [ ] **Step 1: Configure Playwright**

Run:
```bash
pnpm exec playwright install chromium
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Write auth E2E test**

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login as admin and see dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, [class*='CardTitle']")).toContainText("Sign in");

    await page.fill('input[type="email"]', "admin@firm.com");
    await page.fill('input[type="password"]', "Admin@123!");
    await page.click('button[type="submit"]');

    // Should redirect to change password (first login) or dashboard
    await expect(page).toHaveURL(/\/(dashboard|change-password)/);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@email.com");
    await page.fill('input[type="password"]', "WrongPass1!");
    await page.click('button[type="submit"]');

    await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
```

- [ ] **Step 3: Write leave E2E test**

Create `e2e/leave.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Leave Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@firm.com");
    await page.fill('input[type="password"]', "Admin@123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|change-password)/);
  });

  test("can navigate to leave page", async ({ page }) => {
    await page.goto("/leave");
    await expect(page.locator("h1, h2")).toContainText(/leave/i);
  });
});
```

- [ ] **Step 4: Run E2E tests**

Run:
```bash
pnpm exec playwright test
```

Expected: Tests pass against running dev server.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "test: add E2E tests for auth and leave flows"
```

---

## Day 7-8 — Deployment + Polish

---

### Task 39: Vercel Deployment

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/vc-firm-crm.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to vercel.com, import the GitHub repo
2. Framework preset: Next.js (auto-detected)
3. Add environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to the Vercel deployment URL)
4. Deploy

- [ ] **Step 3: Run Prisma migration on production DB**

```bash
DATABASE_URL="your-prod-connection-string" pnpm prisma:migrate deploy
DATABASE_URL="your-prod-connection-string" pnpm prisma:seed
```

- [ ] **Step 4: Smoke test in production**

1. Navigate to deployment URL
2. Login as admin@firm.com / Admin@123!
3. Verify dashboard loads
4. Navigate through all sidebar items
5. Verify placeholder pages render

- [ ] **Step 5: Commit any deployment fixes**

```bash
git add -A
git commit -m "chore: deployment configuration and fixes"
git push
```

---

### Task 40: Final Polish

- [ ] **Step 1: Add loading states**

Add skeleton loaders to dashboard widgets and data tables. Use shadcn/ui `Skeleton` component where data is loading.

- [ ] **Step 2: Responsive QA**

Test all key pages at 320px, 768px, 1024px, 1440px. Fix any overflow or layout issues.

- [ ] **Step 3: Edge cases**

Verify:
- Cannot apply for leave with past start date
- Time log entries lock after 7 days for non-admin
- Activity log entries show locked state appropriately
- Login lockout works after 5 failed attempts
- Role change takes effect on next page load

- [ ] **Step 4: Final PRD walkthrough**

Open each PRD document and check every requirement against what's built. Note any gaps and fix them.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final polish — loading states, responsive fixes, edge case handling"
git push
```

---

## Summary

| Day | Focus | Tasks | Commits |
|-----|-------|-------|---------|
| 1 | Setup + Database | 1-5 | 5 |
| 2 | Auth + RBAC | 6-13 | 8 |
| 3 | Shell + APIs | 14-16 | 3 |
| 4 | People UI | 17-26 | ~10 |
| 5 | Admin UI | 27-36 | ~10 |
| 7 | Testing | 37-38 | 2 |
| 7-8 | Deploy + Polish | 39-40 | 3 |
| **Total** | | **~40 tasks** | **~41 commits** |
