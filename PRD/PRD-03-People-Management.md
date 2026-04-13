# PRD-03 — People Management System
**Project:** Internal VC Firm CRM Platform  
**Module:** People & HR — Employee Directory, Leave, Time Tracking, Activity Log  
**Version:** 1.0  
**Status:** Ready for development  
**Build phase:** Phase 1

---

## 1. Purpose

This module covers all HR and people-related features for Phase 1: the employee directory, leave requests and approvals, time tracking (login/logout logging), and daily activity logging. These features are available to all roles but with different access levels.

---

## 2. Access Matrix

| Feature | Admin | Analyst | Operations |
|---|---|---|---|
| Employee Directory | View all + edit all | View all | View all |
| Leave — apply | Yes | Yes | Yes |
| Leave — view own | Yes | Yes | Yes |
| Leave — view all | Yes | No | No |
| Leave — approve | Yes | No | No |
| Time Log — log own | Yes | Yes | Yes |
| Time Log — view own | Yes | Yes | Yes |
| Time Log — view all employees | Yes | No | No |
| Time Log — edit any | Yes | No | No |
| Activity Log — log own | Yes | Yes | Yes |
| Activity Log — view own | Yes | Yes | Yes |
| Activity Log — view all employees | Yes | No | No |

---

## 3. Sub-Module A: Employee Directory

### 3.1 Purpose
A searchable, filterable list of all active employees. Useful for knowing who is in the firm, their roles, departments, and contact info.

### 3.2 List View
- Table or card grid (user-toggleable)
- Columns: Avatar, Full Name, Role, Department, Email, Status (Active/On Leave/Clocked Out)
- Search by name or email
- Filter by: Role, Department, Status
- Sort by: Name (A-Z, Z-A), Join Date

### 3.3 Employee Profile View
Clicking any employee opens their profile page (read for all, edit for admin).

**Sections:**
- Personal info: name, email, department, role
- Employment info: join date, status, direct manager (optional field for future)
- Leave balance summary: total / used / remaining
- Time log summary: hours this week / this month
- Activity log: recent 5 entries (link to full log)
- Admin-only section: change role, deactivate account, reset password

### 3.4 Data Model: Employee (extends User from PRD-01)
```
department          string
join_date           date
manager_id          FK → users.id (nullable)
leave_balance       integer (days, default 20)
status              enum: active | on_leave | inactive
```

---

## 4. Sub-Module B: Leave Management

### 4.1 Purpose
Employees apply for leave; admins approve or reject. System tracks balances.

### 4.2 Leave Application (all roles)

**"Apply for Leave" form:**
- Leave type: Annual / Sick / Personal / Other
- Start date (date picker)
- End date (date picker) — auto-calculates working days
- Reason / notes (textarea, optional)
- Submit button

On submit:
- Leave request created with status = `pending`
- Admin receives a notification (in-app notification — Phase 1; email — Phase 2)

### 4.3 My Leave Page (all roles)
- Summary cards: Total days / Used / Remaining / Pending approval
- Table of leave history: Type, Dates, Duration, Status (Pending / Approved / Rejected), Admin note
- "Apply for Leave" button at top right

### 4.4 Leave Management Page (Admin only)

**Pending Approvals tab:**
- Table: Employee name, Leave type, Dates, Duration, Reason, Actions (Approve / Reject)
- Reject requires a note (modal with textarea)

**All Leave tab:**
- All leave requests across all employees
- Filters: Employee, Type, Status, Date range
- Export to CSV

**Leave Balances tab:**
- Table of all employees with their balance: Total / Used / Remaining
- Admin can manually adjust balance (e.g., carry-over days) with a note

### 4.5 Data Model: Leave Request
```
id                  UUID
user_id             FK → users.id
leave_type          enum: annual | sick | personal | other
start_date          date
end_date            date
working_days        integer (calculated)
reason              text (nullable)
status              enum: pending | approved | rejected
reviewed_by         FK → users.id (nullable)
reviewer_note       text (nullable)
created_at          timestamp
updated_at          timestamp
```

### 4.6 Business Rules
- Cannot apply for leave on already-approved dates
- Cannot apply with start date in the past
- Sick leave does not deduct from annual balance (tracked separately)
- Working days exclude weekends; public holidays — Phase 2 (placeholder field in model)
- If leave is approved and then cancelled, balance is restored

---

## 5. Sub-Module C: Time Tracking

### 5.1 Purpose
Employees log their work hours by recording login time and logout time each day. Admins can view all logs. The system calculates total daily and weekly hours.

### 5.2 How it works
- Each employee has a "Log my time" section on their dashboard and a dedicated Time Log page
- They manually enter login time and logout time (they are not required to do it in real-time — they can fill it in at end of day)
- System calculates: hours worked = logout time − login time − break (optional)
- One entry per day per employee (admins can create amendments)

### 5.3 Clock-In Widget (Dashboard, all roles)
A persistent card on the dashboard:
```
┌─────────────────────────────────────────┐
│  Today's Time Log          [Edit]        │
│                                          │
│  Login time:   [ 09:00 AM ]             │
│  Logout time:  [ 06:30 PM ]             │
│  Break:        [ 30 min   ]             │
│                                          │
│  Hours worked today:  8.5 hrs   [Save]  │
└─────────────────────────────────────────┘
```
- If no entry for today: shows "Log your time" prompt
- If entry exists: shows current logged times with edit option
- Saving creates or updates today's entry

### 5.4 My Time Log Page (all roles)

**This Week summary:**
- Bar chart: Mon–Fri, hours per day
- Total hours this week / target hours (standard is 40h/week — configurable by admin)
- Indicator if under/over target

**Log Table:**
- Date, Login, Logout, Break, Hours, Notes (optional), Status (Submitted / Amended)
- "Add entry" for past dates (up to 7 days back)
- Edit own entries (up to 7 days back; older entries require admin)

### 5.5 All Employees Time Log (Admin only)

**Overview tab:**
- Table: Employee, Hours this week, Hours this month, Last log date
- Click employee → their full time log

**Detailed view:**
- Filter by employee, date range
- Flag entries with unusual hours (e.g., >12 hours or <1 hour) — highlighted in amber
- Admin can edit any entry with an amendment note
- Export to CSV

### 5.6 Data Model: Time Log Entry
```
id                  UUID
user_id             FK → users.id
log_date            date
login_time          time
logout_time         time
break_minutes       integer (default 0)
hours_worked        decimal (calculated: (logout - login - break) / 60)
notes               text (nullable)
is_amended          boolean (default false)
amended_by          FK → users.id (nullable)
amendment_note      text (nullable)
created_at          timestamp
updated_at          timestamp
```

### 5.7 Business Rules
- One entry per user per date
- Login time must be before logout time
- Hours worked cannot exceed 24
- Entries older than 7 days are locked for self-edit; admin can amend with note
- Weekly summary resets on Monday

---

## 6. Sub-Module D: Daily Activity Log

### 6.1 Purpose
Each employee logs what they worked on each day. This is a brief daily update — tasks completed, notes, blockers. Admins can see all employees' logs for visibility.

### 6.2 Daily Activity Entry (all roles)
A simple form per day:

```
┌─────────────────────────────────────────────┐
│  Today's Activity — April 10, 2026           │
│                                              │
│  What did you work on today?                 │
│  [ textarea — freeform or bullet points ]    │
│                                              │
│  Any blockers or notes?                      │
│  [ textarea — optional ]                     │
│                                              │
│  Tags (optional):                            │
│  [ Deal Work ] [ Research ] [ Operations ]   │
│  [ Admin ] [ Other ]                         │
│                                              │
│                            [Save for Today]  │
└─────────────────────────────────────────────┘
```

- One entry per user per day
- Can be edited any time during the same day; locked at end of day (midnight)
- Admin can always edit/add for any employee

### 6.3 My Activity Log Page (all roles)
- Calendar view + list view toggle
- Each day shows a summary card (click to expand full entry)
- Filter by tag
- Search by keyword

### 6.4 All Employees Activity Log (Admin only)
- Date-based view: pick a date → see all employees' entries for that day
- Employee-based view: pick employee → see their full log history
- Filter by tag, employee, date range
- Export to CSV

### 6.5 Data Model: Activity Log Entry
```
id                  UUID
user_id             FK → users.id
log_date            date
activities          text
blockers            text (nullable)
tags                array of strings
is_locked           boolean (default false — set to true at midnight)
created_at          timestamp
updated_at          timestamp
```

### 6.6 Business Rules
- One entry per user per date
- Entries lock at midnight; admin can override lock
- Tags are predefined (admin can add tags in settings — Phase 2): Deal Work, Research, Operations, Admin, BD, Other
- No minimum length enforced, but UI encourages at least one line

---

## 7. Notifications (Phase 1 — In-app only)

| Event | Who gets notified |
|---|---|
| Leave request submitted | Admin |
| Leave approved / rejected | Requesting employee |
| Admin creates/edits user account | That employee |
| Time log flagged (unusual hours) | Admin |

Notification bell in top bar shows count. Notification dropdown shows last 10. Mark all as read. Full notification history — Phase 2.

---

## 8. UI Structure Summary

```
/directory              Employee Directory (all roles)
/directory/:id          Employee Profile (all roles, admin can edit)
/leave                  My Leave (all roles)
/leave/manage           Leave Management — admin only
/timelog                My Time Log (all roles)
/timelog/all            All Employees Time Log — admin only
/activity               My Activity Log (all roles)
/activity/all           All Employees Activity Log — admin only
```

---

## 9. Technical Requirements

- All date/time stored in UTC; displayed in user's local timezone
- Time inputs: 12-hour format with AM/PM (configurable to 24h in settings)
- Leave calendar must account for weekends (no deduction for Sat/Sun)
- CSV exports generated server-side; streamed to client
- All list views paginated: 25 rows per page, with search overriding pagination

---

## 10. Dependencies

- PRD-01 (Auth & Roles) — required
- PRD-02 (Shell & Navigation) — required (pages slot into the shell)
