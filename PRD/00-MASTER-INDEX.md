# VC Firm CRM Platform — PRD Master Index
**Version:** 1.0  
**Last updated:** April 2026  
**Build scope:** Phase 1 — People Management & Admin

---

## Document Index

| # | Document | Module | Phase | Status |
|---|---|---|---|---|
| PRD-01 | Auth & Role System | Authentication, sessions, RBAC | 1 | Ready |
| PRD-02 | Dashboard & Navigation Shell | Global layout, nav, dashboards | 1 | Ready |
| PRD-03 | People Management | Employee directory, leave, time log, activity log | 1 | Ready |
| PRD-04 | Admin Panel | User management, roles viewer, audit log, settings | 1 | Ready |
| PRD-05 | Future Modules — Placeholders | Pipeline, outreach, research, legal, finance, documents, projects | 2+ | Scaffolding only |

---

## Roles (Phase 1)

| Role | Primary use | Key access |
|---|---|---|
| **Admin** | Platform management | Everything |
| **Analyst** | VC research & deal work | People (own), VC modules (Phase 2) |
| **Operations** | Back-office | People (own), Ops modules (Phase 2) |

> Team Lead role has been removed from scope. The Admin role handles all approval and management functions.

---

## Build Order for Claude Code

Build strictly in this order. Each step depends on the previous.

### Step 1 — PRD-01: Auth Foundation
- Database schema: users, roles, sessions
- Login page + forgot password flow
- JWT auth middleware
- Role context provider
- Seed: 1 default admin account

### Step 2 — PRD-02: Application Shell
- Sidebar + top bar layout component
- Role-aware navigation rendering
- Protected route wrapper
- Placeholder page component (used by all Phase 2 routes)
- Profile page

### Step 3 — PRD-03: People Management
Build in this sub-order:
1. Employee directory (list + profile view)
2. Leave management (apply → approve flow)
3. Time tracking (log entry + admin view)
4. Activity log (daily entry + admin view)

### Step 4 — PRD-04: Admin Panel
1. Admin home stats
2. User list + create + edit
3. Roles viewer (read-only)
4. Audit log
5. Settings page (active Phase 1 settings + placeholder Phase 2 settings)

### Step 5 — PRD-05: Scaffold Future Modules
1. Run all scaffold database migrations
2. Register all placeholder routes
3. Confirm sidebar nav renders all items (active + coming soon)
4. Set all feature flags to `false`

---

## Tech Stack Recommendations

These are recommendations. The team may override, but consistency across modules is important.

| Layer | Recommendation |
|---|---|
| Frontend | React + Next.js (App Router) |
| Styling | Tailwind CSS |
| State | React Context + SWR or TanStack Query |
| Backend | Next.js API routes or standalone Express/Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Custom JWT (see PRD-01) — or NextAuth.js as a wrapper |
| File Storage | AWS S3 or Cloudflare R2 (for Phase 2 uploads) |
| Email | Resend or Postmark (for password reset, notifications) |

---

## Global Constraints

- All routes protected by auth by default — opt-in for public routes (only `/login`, `/reset-password`)
- All API endpoints validate role server-side — client-side role checks are UX only, not security
- Soft deletes everywhere — nothing is permanently deleted in Phase 1
- All timestamps stored in UTC
- Pagination default: 25 rows per page
- Mobile responsive: sidebar collapses, all tables scroll horizontally on small screens

---

## What Phase 2 Will Add (do not build, only scaffold)

- Deal Pipeline with Kanban board
- Lead & Contact Outreach tracker
- Research Hub with rich text docs
- Legal Vault with document storage
- Finance & Expense tracking
- Shared Document Store
- Project Planner with Gantt-lite milestones
- Email notifications (SMTP)
- Global search
- Full notification history
- Custom role editor
- Public holiday calendar for leave
- SSO / Google Workspace login

---

## Naming Conventions for Claude Code

- Components: PascalCase (`UserProfileCard`, `LeaveRequestForm`)
- API routes: kebab-case (`/api/leave-requests`, `/api/time-logs`)
- Database tables: snake_case plural (`users`, `leave_requests`, `time_log_entries`)
- Environment variables: SCREAMING_SNAKE_CASE (`DATABASE_URL`, `JWT_SECRET`)
- Feature flags: `FEATURE_` prefix (`FEATURE_PIPELINE`, `FEATURE_LEGAL`)
