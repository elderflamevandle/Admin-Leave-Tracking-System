# PRD-04 — Admin Panel
**Project:** Internal VC Firm CRM Platform  
**Module:** Admin — User Management, Roles & Permissions, Audit Log, Settings  
**Version:** 1.0  
**Status:** Ready for development  
**Build phase:** Phase 1  
**Access:** Admin role only (every page in this module is admin-only)

---

## 1. Purpose

The admin panel is the control center of the platform. Admins manage user accounts, assign roles, review audit logs, and configure global settings. No other role can access any part of this module.

---

## 2. Module Pages

```
/admin                          Admin home — summary stats
/admin/users                    User list
/admin/users/new                Create new user
/admin/users/:id                User profile + edit
/admin/roles                    Role viewer (Phase 1: read-only; Phase 2: editable)
/admin/audit                    Audit log
/admin/settings                 Platform settings
```

---

## 3. Admin Home (/admin)

A summary dashboard for operational awareness.

**Stat cards (top row):**
- Total active employees
- Employees clocked in today
- Pending leave requests (with quick link to leave management)
- New user accounts created this month

**Recent activity feed:**
- Last 10 audit log events (who did what, when)
- Link to full audit log

**Quick actions:**
- [ + Create New User ]
- [ View Pending Leave ]
- [ Export Time Logs ]

---

## 4. User Management (/admin/users)

### 4.1 User List

**Table columns:**
- Avatar + Full Name
- Email
- Role (badge: Admin / Analyst / Operations)
- Department
- Status (Active / Inactive)
- Last Login
- Actions (Edit, Deactivate)

**Controls:**
- Search by name or email
- Filter by: Role, Department, Status
- Sort by: Name, Join Date, Last Login
- [ + Add New User ] button (top right)

### 4.2 Create New User (/admin/users/new)

**Form fields:**
- Full name (required)
- Email address (required, must be unique)
- Role (dropdown: Admin / Analyst / Operations)
- Department (text field, optional)
- Join date (date picker, defaults to today)
- Profile photo (optional upload)
- Send welcome email toggle (on by default — email contains temporary password)

**On submit:**
- User account created
- Temporary password generated and emailed to the new employee
- Employee must change password on first login (forced password change flow)
- Audit event logged: `user.created`

### 4.3 Edit User (/admin/users/:id)

**Editable fields:**
- Full name
- Department
- Role (changing role takes effect immediately on user's next page load)
- Join date
- Profile photo
- Leave balance (manual override with required note)
- Status (Active / Inactive toggle)

**Read-only fields:**
- Email (shown but not editable — contact platform admin to change)
- Created at
- Last login

**Admin actions section:**
- Reset password (sends reset email to user)
- Force logout (invalidates all active sessions for this user)
- Deactivate account (modal confirmation required; soft delete — all data preserved)
- Reactivate account (if previously deactivated)

**User's data summary (read-only links):**
- View their time logs
- View their leave history
- View their activity log

---

## 5. Roles & Permissions (/admin/roles)

### 5.1 Phase 1 — Read-only viewer

Displays a clear, readable breakdown of what each role can access. Not editable in Phase 1 — roles and permissions are defined in code.

**Layout:**
- Tab per role: Admin | Analyst | Operations
- Each tab shows a table of all permission keys grouped by module
- Checkmark ✓ or dash — per permission per role
- Note at bottom: "To modify role permissions, contact your system administrator."

**Displayed permission groups:**
- VC & Deal Modules (pipeline, outreach, research)
- Operations Modules (legal, finance, documents)
- People Modules (leave, time log, activity log)
- Admin Modules (users, roles, audit, settings)

### 5.2 Phase 2 — Editable roles
> Scaffold the UI to make this upgrade possible: use a data-driven approach (permissions loaded from API, not hardcoded in the component) even in Phase 1.

---

## 6. Audit Log (/admin/audit)

### 6.1 Purpose
A tamper-evident log of all significant actions taken in the platform. Read-only. Cannot be edited or deleted.

### 6.2 Table columns
- Timestamp (date + time)
- User (who performed the action)
- Action (event key, e.g., `user.created`, `leave.approved`)
- Details (human-readable summary, e.g., "Created account for Jane Smith (Analyst)")
- IP address
- Module (badge: Auth / Users / Leave / Time / Activity / Admin)

### 6.3 Filters
- Date range (from / to)
- User (search by name)
- Module
- Action type

### 6.4 Audit Events to Log

| Event key | Trigger |
|---|---|
| `auth.login` | Successful login |
| `auth.login_failed` | Failed login attempt |
| `auth.logout` | User logout |
| `auth.password_reset` | Password reset completed |
| `auth.force_logout` | Admin force-logged out a user |
| `user.created` | New user account created |
| `user.updated` | User profile edited |
| `user.role_changed` | User role changed |
| `user.deactivated` | Account deactivated |
| `user.reactivated` | Account reactivated |
| `leave.submitted` | Leave request submitted |
| `leave.approved` | Leave request approved |
| `leave.rejected` | Leave request rejected |
| `leave.cancelled` | Leave request cancelled |
| `leave.balance_adjusted` | Admin manually adjusted leave balance |
| `timelog.created` | Time log entry created |
| `timelog.amended` | Time log entry amended by admin |
| `activitylog.created` | Activity log entry created |
| `activitylog.edited` | Activity log entry edited |
| `settings.updated` | Platform settings changed |

### 6.5 Data Model: Audit Log
```
id                  UUID
user_id             FK → users.id (who did it)
event_key           string
details             text (human-readable summary)
metadata            JSON (structured details — IDs, old/new values)
ip_address          string
user_agent          string
module              string
created_at          timestamp
```

### 6.6 Technical notes
- Audit log is append-only — no UPDATE or DELETE on this table ever
- Logged server-side (not client-side — cannot be bypassed)
- Retention: keep all records indefinitely (or configurable in Phase 2)
- Export: admin can export filtered audit log to CSV

---

## 7. Platform Settings (/admin/settings)

### 7.1 Phase 1 — Active settings

**Working hours**
- Standard working hours per day (default: 8)
- Standard working days per week (default: Mon–Fri)
- These values used in time tracking summaries

**Leave policy**
- Default annual leave days per employee (default: 20)
- Applied to new accounts on creation; existing balances not auto-adjusted

**Time log settings**
- Time format: 12-hour / 24-hour (global setting)
- Self-edit window: number of days an employee can edit past time entries (default: 7)

**Firm details**
- Firm name (shown in top bar and emails)
- Firm logo (uploaded image, shown in top bar and login page)

### 7.2 Phase 2 — Placeholder settings (visible but inactive, with "Coming soon" labels)

- **Email notifications** — configure which events trigger emails, SMTP settings
- **Public holidays calendar** — define holidays to exclude from leave calculations
- **SSO / OAuth integration** — Google Workspace login
- **Two-factor authentication** — enforce 2FA for all or specific roles
- **Custom role editor** — modify permissions per role
- **Slack / Teams integration** — send notifications to channels
- **Data export & backup** — scheduled exports

> Placeholder settings should render as disabled form sections with a "Coming in a future update" label. They establish the visual presence and layout so Phase 2 development simply enables them.

---

## 8. UI & UX Notes

- Every destructive action (deactivate, force logout) requires a confirmation modal: "Are you sure? This cannot be undone."
- Role changes show a warning: "Changing this user's role will update their access immediately."
- All admin forms validate inline before submit
- Success/error states use toast notifications (non-blocking, auto-dismiss after 4 seconds)
- Admin panel pages have a distinct visual indicator (e.g., subtle "Admin" badge in the breadcrumb) so it's always clear you are in the admin section

---

## 9. Technical Requirements

- All admin routes protected with role guard: redirect to dashboard with "Access denied" toast if non-admin attempts to access
- Role check happens server-side (API) not just client-side (UI)
- Settings stored in a `platform_settings` key-value table (not hardcoded)
- Audit log writes are synchronous — if the audit write fails, the primary action should still succeed but the failure should be logged to the server error log

---

## 10. Dependencies

- PRD-01 (Auth & Roles) — required
- PRD-02 (Shell) — required
- PRD-03 (People Management) — Admin panel links into people module pages
