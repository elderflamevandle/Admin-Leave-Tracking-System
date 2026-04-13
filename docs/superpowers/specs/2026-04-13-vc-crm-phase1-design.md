# VC Firm CRM Platform — Phase 1 Design Spec

**Version:** 1.0
**Date:** 2026-04-13
**Status:** Approved
**Author:** Claude Code + Chaitanya
**Build approach:** Compressed Sprint (Approach B) — horizontal layers, parallel agents

---

## 1. Overview

Build Phase 1 of an internal VC Firm CRM platform covering authentication, role-based access control, an application shell with role-aware navigation, people management (employee directory, leave, time tracking, activity logs), an admin panel, and scaffolded Phase 2 module placeholders. Target: production-ready in 8 working days.

---

## 2. Context

- **Builder:** Solo developer + Claude Code (autonomous build, human review)
- **Deployment:** Vercel (frontend) + Supabase (PostgreSQL)
- **Timeline:** ASAP — compressed 8-day sprint
- **Developer familiarity:** Intermediate with Next.js/Prisma/Tailwind — knows basics, may need help with advanced patterns

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | SSR, API routes, file-based routing — all-in-one |
| Database | PostgreSQL on Supabase | Free tier, hosted, connection pooling |
| ORM | Prisma | Type-safe queries, migration system, seeding |
| Auth | Custom JWT | Access token (15min) + refresh token (7-30 days), bcrypt |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI with polished components |
| Data Fetching | TanStack Query | Caching, revalidation, optimistic updates |
| Charts | Recharts | Lightweight, for time log bar charts |
| Email | Resend | Password reset, welcome emails |
| Deployment | Vercel | Zero-config Next.js hosting |
| Testing | Vitest + Playwright | Unit/integration + E2E |
| CSV Export | Server-side streaming | As PRD requires |

---

## 4. Architecture

### 4.1 Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Public routes
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/               # Protected routes
│   │   ├── layout.tsx             # Shell: sidebar + topbar
│   │   ├── dashboard/page.tsx
│   │   ├── directory/
│   │   │   ├── page.tsx           # Employee list
│   │   │   └── [id]/page.tsx      # Employee profile
│   │   ├── leave/
│   │   │   ├── page.tsx           # My Leave
│   │   │   └── manage/page.tsx    # Admin: Leave Management
│   │   ├── timelog/
│   │   │   ├── page.tsx           # My Time Log
│   │   │   └── all/page.tsx       # Admin: All Time Logs
│   │   ├── activity/
│   │   │   ├── page.tsx           # My Activity Log
│   │   │   └── all/page.tsx       # Admin: All Activity Logs
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin home
│   │   │   ├── users/
│   │   │   │   ├── page.tsx       # User list
│   │   │   │   ├── new/page.tsx   # Create user
│   │   │   │   └── [id]/page.tsx  # Edit user
│   │   │   ├── roles/page.tsx     # Roles viewer
│   │   │   ├── audit/page.tsx     # Audit log
│   │   │   └── settings/page.tsx  # Platform settings
│   │   ├── profile/page.tsx
│   │   ├── pipeline/page.tsx      # Placeholder
│   │   ├── outreach/page.tsx      # Placeholder
│   │   ├── research/page.tsx      # Placeholder
│   │   ├── legal/page.tsx         # Placeholder
│   │   ├── finance/page.tsx       # Placeholder
│   │   ├── documents/page.tsx     # Placeholder
│   │   └── projects/page.tsx      # Placeholder
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── refresh/route.ts
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── users/route.ts
│       ├── users/[id]/route.ts
│       ├── leave/route.ts
│       ├── leave/[id]/route.ts
│       ├── leave/[id]/approve/route.ts
│       ├── leave/[id]/reject/route.ts
│       ├── timelog/route.ts
│       ├── timelog/[id]/route.ts
│       ├── activity/route.ts
│       ├── activity/[id]/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── audit/route.ts
│       │   └── settings/route.ts
│       ├── notifications/route.ts
│       └── export/[type]/route.ts
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── Shell.tsx
│   │   └── MobileDrawer.tsx
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx
│   │   ├── AnalystDashboard.tsx
│   │   └── OperationsDashboard.tsx
│   ├── shared/
│   │   ├── PlaceholderPage.tsx
│   │   ├── DataTable.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── CSVExportButton.tsx
│   └── forms/
│       ├── LeaveApplicationForm.tsx
│       ├── TimeLogEntryForm.tsx
│       ├── ActivityLogForm.tsx
│       ├── UserForm.tsx
│       └── SettingsForm.tsx
├── lib/
│   ├── auth.ts                    # JWT sign/verify, bcrypt
│   ├── permissions.ts             # Permission keys, role mappings, hasPermission()
│   ├── db.ts                      # Prisma client singleton
│   ├── audit.ts                   # logAudit() helper
│   ├── notifications.ts           # createNotification() helper
│   ├── email.ts                   # Resend wrapper
│   ├── csv.ts                     # CSV streaming export
│   └── utils.ts                   # Date helpers, working days calc
├── hooks/
│   ├── useAuth.ts
│   ├── useRole.ts
│   ├── useNotifications.ts
│   └── usePagination.ts
├── middleware.ts                   # JWT validation, route protection
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
└── types/
    └── index.ts
```

### 4.2 Key Architecture Decisions

1. **Route groups** — `(auth)` for public, `(dashboard)` for protected. Next.js middleware checks JWT on all `(dashboard)` routes.
2. **Server-side RBAC** — Every API route validates role via middleware. Client-side checks are UX only.
3. **Soft deletes** — `is_active` boolean on users. No `DELETE FROM` in Phase 1.
4. **Single Prisma schema** — All Phase 1 + Phase 2 tables in one schema file, one migration.
5. **Feature flags** — Stored in `platform_settings` table. Sidebar reads flags to render "coming soon" items.
6. **Append-only audit** — No UPDATE/DELETE on audit_logs table. Logged server-side, synchronous.
7. **UTC everywhere** — All timestamps UTC in DB, displayed in user's local timezone on frontend.

---

## 5. Database Schema

### 5.1 Phase 1 Active Tables

**users**
```
id              UUID, PK
full_name       string, not null
email           string, unique, not null
password_hash   string, not null
role_id         FK → roles.id
department      string, nullable
avatar_url      string, nullable
join_date       date, default now
leave_balance   integer, default 20
is_active       boolean, default true
force_password_change  boolean, default false
last_login_at   timestamp, nullable
created_at      timestamp, default now
updated_at      timestamp, auto-update
```

**roles**
```
id              UUID, PK
name            string, unique (admin | analyst | operations)
display_name    string
permissions     JSON (array of permission key strings)
created_at      timestamp, default now
```

**sessions**
```
id              UUID, PK
user_id         FK → users.id
token_hash      string
refresh_token_hash  string
expires_at      timestamp
created_at      timestamp, default now
ip_address      string
user_agent      string
```

**leave_requests**
```
id              UUID, PK
user_id         FK → users.id
leave_type      enum: annual | sick | personal | other
start_date      date
end_date        date
working_days    integer (calculated, excludes weekends)
reason          text, nullable
status          enum: pending | approved | rejected | cancelled
reviewed_by     FK → users.id, nullable
reviewer_note   text, nullable
created_at      timestamp, default now
updated_at      timestamp, auto-update
```

**time_log_entries**
```
id              UUID, PK
user_id         FK → users.id
log_date        date (unique constraint: user_id + log_date)
login_time      time
logout_time     time
break_minutes   integer, default 0
hours_worked    decimal (calculated)
notes           text, nullable
is_amended      boolean, default false
amended_by      FK → users.id, nullable
amendment_note  text, nullable
created_at      timestamp, default now
updated_at      timestamp, auto-update
```

**activity_log_entries**
```
id              UUID, PK
user_id         FK → users.id
log_date        date (unique constraint: user_id + log_date)
activities      text, not null
blockers        text, nullable
tags            string array
is_locked       boolean, default false
created_at      timestamp, default now
updated_at      timestamp, auto-update
```

**audit_logs** (append-only)
```
id              UUID, PK
user_id         FK → users.id
event_key       string, not null
details         text
metadata        JSON, nullable
ip_address      string
user_agent      string
module          string
created_at      timestamp, default now
```

**notifications**
```
id              UUID, PK
user_id         FK → users.id (recipient)
title           string
message         text
is_read         boolean, default false
link            string, nullable
created_at      timestamp, default now
```

**login_attempts**
```
id              UUID, PK
email           string, not null
ip_address      string
attempted_at    timestamp, default now
```
> Track failed login attempts. Count recent attempts per email to enforce lockout (5 in 15 min). Prune old records periodically.

**password_reset_tokens**
```
id              UUID, PK
user_id         FK → users.id
token_hash      string, not null
expires_at      timestamp (1 hour from creation)
used_at         timestamp, nullable
created_at      timestamp, default now
```
> One active token per user. Mark `used_at` on consumption. Expired/used tokens ignored.

**platform_settings**
```
id              UUID, PK
key             string, unique
value           JSON
updated_at      timestamp, auto-update
updated_by      FK → users.id, nullable
```

### 5.2 Phase 2 Scaffold Tables (empty, migrations only)

deals, contacts, contact_interactions, research_docs, legal_documents, expenses, invoices, doc_folders, doc_files, projects, project_members, project_milestones, project_tasks

Schemas as defined in PRD-05. All FK references to users table established. No seed data.

### 5.3 Seed Data

- **3 roles:** Admin (all permissions), Analyst (VC + own people), Operations (ops + own people)
- **1 admin user:** admin@firm.com, temporary password, force_password_change=true
- **Platform settings:** working_hours_per_day=8, working_days=Mon-Fri, default_leave_days=20, self_edit_window_days=7, time_format=12h, firm_name="VC Firm"
- **Activity tags:** Deal Work, Research, Operations, Admin, BD, Other
- **Feature flags:** FEATURE_PIPELINE=false, FEATURE_OUTREACH=false, FEATURE_RESEARCH=false, FEATURE_LEGAL=false, FEATURE_FINANCE=false, FEATURE_DOCUMENTS=false, FEATURE_PROJECTS=false

---

## 6. RBAC System

### 6.1 Permission Keys

```
// VC Modules
pipeline.view, pipeline.create, pipeline.edit, pipeline.delete
outreach.view, outreach.create, outreach.edit, outreach.delete
research.view, research.create, research.edit, research.delete

// Operations Modules
legal.view, legal.create, legal.edit, legal.delete
finance.view, finance.create, finance.edit, finance.delete
documents.view, documents.create, documents.edit, documents.delete

// People Modules
leave.view_own, leave.apply, leave.approve_all
timelog.view_own, timelog.view_all, timelog.edit_all
activitylog.view_own, activitylog.view_all

// Admin Modules
users.view, users.create, users.edit, users.deactivate
roles.manage, audit.view, settings.manage
```

### 6.2 Role Mappings

- **Admin:** All permissions
- **Analyst:** pipeline.*, outreach.*, research.*, leave.view_own, leave.apply, timelog.view_own, activitylog.view_own, documents.view
- **Operations:** legal.*, finance.*, documents.*, leave.view_own, leave.apply, timelog.view_own, activitylog.view_own

### 6.3 Enforcement

- `middleware.ts` — validates JWT, extracts user+role, blocks unauthenticated
- `hasPermission(role, key)` — checked in every API route handler
- UI components use `useRole()` hook to conditionally render

---

## 7. Auth Flow

### 7.1 Login
1. POST /api/auth/login with email + password
2. Verify bcrypt hash
3. Check lockout (5 failed attempts → 15 min cooldown)
4. Create session record
5. Return access token (JWT, 15 min) + refresh token (7 or 30 days based on "remember me")
6. Set refresh token as httpOnly cookie
7. If force_password_change=true, redirect to change password page

### 7.2 Token Refresh
1. POST /api/auth/refresh with refresh token from cookie
2. Verify refresh token against session
3. Issue new access token
4. TanStack Query interceptor handles this transparently

### 7.3 Forgot Password
1. POST /api/auth/forgot-password with email
2. Generate reset token (1 hour expiry), store hash in DB
3. Send email via Resend with reset link
4. Always respond "If this email exists, a reset link has been sent"

### 7.4 Logout
1. POST /api/auth/logout
2. Delete session record
3. Clear refresh token cookie
4. Log audit event

---

## 8. Sprint Plan

### Day 1 — Project Setup + Full Database (~4-5 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | Init Next.js 15 project (App Router, TS, Tailwind, ESLint) | 20 min |
| 2 | Install dependencies (shadcn/ui, Prisma, TanStack Query, bcrypt, jose, resend, recharts) | 20 min |
| 3 | Supabase project setup (create project, connection string, env config) | 15 min |
| 4 | Full Prisma schema (all 20+ tables — Phase 1 + Phase 2) | 60 min |
| 5 | Run initial migration | 10 min |
| 6 | Seed script (roles, admin user, platform settings, tags) | 30 min |
| 7 | Git init, .env.example, .gitignore, first commit | 10 min |

**Exit criteria:** DB fully provisioned, Prisma Studio shows all tables, seed data loaded.

### Day 2 — Auth System + RBAC (~5-6 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | JWT utilities (sign/verify access + refresh tokens, bcrypt helpers) | 45 min |
| 2 | Auth API routes (login, logout, refresh, forgot-password, reset-password) | 90 min |
| 3 | Next.js middleware (JWT validation on all (dashboard) routes) | 45 min |
| 4 | RBAC permission system (keys, role mappings, hasPermission()) | 30 min |
| 5 | Login page, forgot password page, reset password page | 60 min |
| 6 | Auth context provider + useAuth() hook | 30 min |
| 7 | Login lockout logic (5 attempts → 15 min) | 20 min |

**Exit criteria:** Login as admin works, JWT issued, middleware blocks unauthenticated, forgot password flow works.

### Day 3 — App Shell + All API Routes (~5-6 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | Sidebar component (role-aware, collapsible, coming soon badges) | 60 min |
| 2 | Top bar (logo, search placeholder, notification bell, avatar dropdown) | 30 min |
| 3 | Layout shell ((dashboard)/layout.tsx) | 20 min |
| 4 | Responsive behavior (mobile drawer, tablet collapsed, desktop full) | 30 min |
| 5 | Profile page + API (view/edit own, change password) | 45 min |
| 6 | People API routes (/api/users, /api/leave, /api/timelog, /api/activity) | 90 min |
| 7 | Admin API routes (/api/admin/users, /api/admin/audit, /api/admin/settings) | 60 min |
| 8 | Notification API + audit log utility | 40 min |

**Exit criteria:** All APIs callable. Shell renders with correct sidebar per role.

### Day 4 — People Management UI (~5-6 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | Employee directory (table/card grid, search, filters, sort) | 60 min |
| 2 | Employee profile view (info, summaries, admin actions) | 45 min |
| 3 | My Leave page (summary cards, history table, apply form) | 60 min |
| 4 | Leave Management — admin (pending, all leave, balances tabs) | 60 min |
| 5 | My Time Log page (weekly chart, log table, clock-in widget) | 60 min |
| 6 | All Time Logs — admin (overview, detailed, flag unusual, amend) | 45 min |

**Exit criteria:** All People pages functional. Leave apply→approve flow works.

### Day 5 — Activity Log + Admin Panel UI (~5-6 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | My Activity Log (daily entry form, calendar/list toggle, tags, search) | 45 min |
| 2 | All Activity Logs — admin (date/employee views, filters, CSV) | 40 min |
| 3 | Role-specific dashboards (Admin, Analyst, Operations widgets) | 60 min |
| 4 | Admin home (stats, audit feed, quick actions) | 30 min |
| 5 | User management (list, create, edit, deactivate/reactivate) | 60 min |
| 6 | Roles viewer (tab per role, permission matrix) | 30 min |
| 7 | Audit log page (table, filters, CSV export) | 40 min |
| 8 | Platform settings page (active + Phase 2 placeholders) | 40 min |

**Exit criteria:** Full admin panel working. All dashboards render correct widgets per role.

### Day 6 — Scaffold + Notifications + Polish (~4-5 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | PlaceholderPage component + all Phase 2 routes registered | 40 min |
| 2 | Feature flags (read from platform_settings, gate sidebar) | 20 min |
| 3 | Notification system (bell, dropdown, mark read, triggered by events) | 45 min |
| 4 | CSV exports (leave, timelog, activity, audit — server-side streaming) | 40 min |
| 5 | Toast system + confirmation modals for destructive actions | 20 min |
| 6 | Forced password change on first login | 20 min |
| 7 | Welcome email via Resend for new users | 20 min |

**Exit criteria:** All routes work. Notifications flow. Exports download. Phase 2 nav shows coming soon.

### Day 7 — Testing + Deployment (~5-6 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | Unit tests (auth utils, RBAC, business rules, date calculations) | 60 min |
| 2 | Integration tests (all API routes — auth, CRUD, role guards, audit) | 90 min |
| 3 | E2E tests with Playwright (login, leave lifecycle, time log, admin CRUD) | 60 min |
| 4 | Vercel deployment (connect repo, env vars, build verify) | 30 min |
| 5 | Supabase production (prod DB, migration, seed admin) | 20 min |
| 6 | Production smoke test (login, all pages, core flows) | 30 min |

**Exit criteria:** Tests passing (80%+ coverage on utils/lib). Live on Vercel. Team can access.

### Day 8 — Buffer + Final Polish (~3-4 hours)

| # | Task | Duration |
|---|------|----------|
| 1 | Bug fixes from day 7 testing | 60-120 min |
| 2 | Edge cases (past-date leave, time log locks, activity midnight lock) | 45 min |
| 3 | Responsive QA (320, 768, 1024, 1440px) | 30 min |
| 4 | Loading states (skeleton loaders, table loading) | 20 min |
| 5 | Final PRD compliance walkthrough | 30 min |

**Exit criteria:** All PRD requirements met. No critical bugs. Responsive on all breakpoints.

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

**Target:** 80%+ coverage on lib/ and utils

| Module | What's Tested |
|--------|--------------|
| lib/auth.ts | JWT sign/verify, bcrypt hash/compare, token expiry |
| lib/permissions.ts | hasPermission() for all role+key combos, edge cases |
| lib/utils.ts | Working days calculation, date range overlap, hours calc |
| lib/audit.ts | Audit event creation, required fields validation |
| lib/csv.ts | CSV formatting, streaming output |

### 9.2 Integration Tests (Vitest + test DB)

**Target:** All API routes covered

| Flow | Endpoints Tested |
|------|-----------------|
| Auth lifecycle | login → refresh → logout, forgot → reset |
| Login lockout | 5 failed → lockout → cooldown → success |
| Leave lifecycle | apply → approve/reject, cancel, balance update |
| Time log CRUD | create → read → edit → lock after 7 days |
| Activity log CRUD | create → edit → lock at midnight |
| Admin user mgmt | create → edit role → deactivate → reactivate |
| RBAC enforcement | Analyst can't access admin routes, Ops can't access VC routes |
| Audit logging | Every mutating action produces audit record |
| CSV export | All 4 export types produce valid CSV |

### 9.3 E2E Tests (Playwright)

**Target:** 6 critical user journeys

1. **Login flow:** Login as admin → see admin dashboard → logout
2. **Leave lifecycle:** Apply leave → admin sees pending → approve → balance updated
3. **Time log entry:** Log time for today → see in weekly chart → edit
4. **Activity log:** Write daily update → see in calendar view → verify lock
5. **Admin user CRUD:** Create user → edit role → deactivate → verify login blocked
6. **Role-based nav:** Login as analyst → verify no admin nav → verify no ops modules

### 9.4 Responsive Testing (Playwright screenshots)

Key pages at 320px, 768px, 1024px, 1440px:
- Dashboard, Employee Directory, Leave Management, Time Log, Admin Users

---

## 10. Deployment Architecture

```
[User Browser]
     │
     ▼
[Vercel Edge] ── middleware.ts (JWT check)
     │
     ▼
[Next.js App]
├── Server Components (pages)
├── API Routes (/api/*)
│     │
│     ▼
│   [Supabase PostgreSQL]
│     (connection pooling via Supabase)
│
└── [Resend API] (email delivery)
```

### Environment Variables

```
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
DIRECT_URL=postgresql://...@supabase.co:5432/postgres
JWT_SECRET=<random 64 char>
JWT_REFRESH_SECRET=<random 64 char>
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase connection pooling limits on free tier | API timeouts under load | Use connection pooling URL, implement retry logic |
| JWT token refresh race condition | Users randomly logged out | Queue concurrent refresh requests, only first executes |
| Leave working days calculation bugs | Wrong balance deductions | Thorough unit tests for date edge cases, weekend handling |
| Midnight activity lock across timezones | Lock too early/late | Lock based on UTC, document that lock is UTC midnight |
| Prisma migration conflicts if schema changes mid-sprint | Dev slowdown | Schema done in Day 1, no changes after initial migration |
| Resend email delivery delays | User doesn't get reset email | Show clear "check spam" messaging, implement resend button with 60s cooldown |

---

## 12. Success Criteria

- [ ] All 3 roles can log in and see role-appropriate dashboards
- [ ] Admin can create/edit/deactivate users
- [ ] Leave apply → approve/reject flow works end-to-end
- [ ] Time logging with weekly summaries works
- [ ] Activity logging with daily lock works
- [ ] Audit log captures all events listed in PRD-04
- [ ] All Phase 2 routes render placeholder pages
- [ ] Sidebar shows correct nav per role with coming soon badges
- [ ] Notification bell shows unread count and dropdown
- [ ] CSV exports work for leave, timelog, activity, audit
- [ ] Responsive at 320, 768, 1024, 1440px
- [ ] Tests pass with 80%+ coverage on core utils
- [ ] Deployed and accessible on Vercel
- [ ] No hardcoded secrets in codebase

---

## 13. What This Spec Does NOT Cover

- Phase 2 module functionality (pipeline, outreach, research, legal, finance, documents, projects)
- SSO / OAuth / Google Workspace login
- Two-factor authentication
- Email notifications beyond password reset and welcome
- Public holiday calendar
- Custom role editor
- Global search functionality
- Full notification history page
- Mobile app
