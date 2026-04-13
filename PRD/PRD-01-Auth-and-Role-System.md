# PRD-01 — Authentication & Role System
**Project:** Internal VC Firm CRM Platform  
**Module:** Foundation — Auth, Session & Role-Based Access Control  
**Version:** 1.0  
**Status:** Ready for development  
**Build phase:** Phase 1 (required before all other modules)

---

## 1. Purpose

This module is the security and access foundation for the entire platform. Every other module depends on it. It handles user authentication, session management, and enforces role-based access so each employee only sees and interacts with what their role permits.

---

## 2. Roles

The platform currently defines **three roles**. The system must be architected to support adding new roles without schema changes (use a roles table, not hardcoded enum).

| Role | Description |
|---|---|
| **Admin** | Full platform access. Manages users, roles, permissions, audit logs. |
| **Analyst** | Access to VC modules: pipeline, outreach, research. Limited ops access. |
| **Operations** | Access to ops modules: legal, finance, documents. No VC pipeline access. |

> **Design note:** Two additional roles are scoped but not active in Phase 1: `Researcher` (read-heavy, VC modules) and `Intern` (read-only, limited). Scaffold the role system to accommodate these without migrations.

---

## 3. Functional Requirements

### 3.1 Login
- Email + password authentication
- "Remember me" toggle (persistent session up to 30 days)
- Password strength enforcement on creation: min 8 chars, 1 uppercase, 1 number, 1 special char
- Failed login lockout after 5 attempts (15 min cooldown)
- Forgot password → email reset link (expires in 1 hour)

### 3.2 Session Management
- JWT-based sessions with refresh tokens
- Auto logout after 8 hours of inactivity
- Employees log their own work time separately (see PRD-04) — this is not the same as session tracking
- Active session shown on profile page ("last login: X")

### 3.3 Role-Based Access Control (RBAC)
- Middleware guard on every route and API endpoint
- Role is stored on the user record; permissions are derived from role
- UI: navigation items, buttons, and sections are conditionally rendered based on role — no "greyed out but visible" for sensitive sections; they simply don't render
- Admin can change a user's role at any time; change takes effect on next page load (no re-login required)

### 3.4 User Account Management (Admin only)
- Admin can create user accounts (name, email, role, department)
- Admin can deactivate accounts (soft delete — preserves all historical data)
- Admin can reset any user's password
- Admin can view all active sessions and force-logout a user

---

## 4. Data Models

### User
```
id              UUID, primary key
full_name       string
email           string, unique
password_hash   string
role            FK → roles.id
department      string (optional)
avatar_url      string (optional)
is_active       boolean, default true
created_at      timestamp
updated_at      timestamp
last_login_at   timestamp
```

### Role
```
id              UUID, primary key
name            string (admin | analyst | operations | ...)
display_name    string
permissions     JSON array of permission keys
created_at      timestamp
```

### Session
```
id              UUID, primary key
user_id         FK → users.id
token_hash      string
expires_at      timestamp
created_at      timestamp
ip_address      string
user_agent      string
```

---

## 5. UI Screens

### 5.1 Login Page
- Full-screen centered layout
- Company logo at top
- Email + password fields
- "Remember me" checkbox
- "Forgot password?" link
- Submit button
- No sign-up link (accounts are admin-created only)

### 5.2 Forgot Password Flow
- Screen 1: Enter email → "If this email exists, a reset link has been sent"
- Screen 2 (via link): New password + confirm password fields
- On success: redirect to login with success toast

### 5.3 Post-Login Redirect
- All roles → Dashboard (PRD-02)
- Dashboard content differs by role (see PRD-02)

---

## 6. Permission Keys (for RBAC middleware)

Define these as constants in code. Assign arrays of these to each role.

```
// VC Modules
pipeline.view          pipeline.create        pipeline.edit         pipeline.delete
outreach.view          outreach.create        outreach.edit         outreach.delete
research.view          research.create        research.edit         research.delete

// Operations Modules
legal.view             legal.create           legal.edit            legal.delete
finance.view           finance.create         finance.edit          finance.delete
documents.view         documents.create       documents.edit        documents.delete

// People Modules
leave.view_own         leave.apply            leave.approve_all
timelog.view_own       timelog.view_all       timelog.edit_all
activitylog.view_own   activitylog.view_all

// Admin Modules
users.view             users.create           users.edit            users.deactivate
roles.manage
audit.view
settings.manage
```

### Default Role → Permission Mapping

**Admin:** All permissions  
**Analyst:** `pipeline.*`, `outreach.*`, `research.*`, `leave.view_own`, `leave.apply`, `timelog.view_own`, `activitylog.view_own`, `documents.view`  
**Operations:** `legal.*`, `finance.*`, `documents.*`, `leave.view_own`, `leave.apply`, `timelog.view_own`, `activitylog.view_own`

---

## 7. Technical Requirements

- Backend: REST API (or tRPC), with middleware permission checks on every protected route
- Passwords: bcrypt hashed, never stored in plain text
- Tokens: JWT (access token: 15 min, refresh token: 7-30 days depending on remember me)
- HTTPS only — no plain HTTP in production
- All auth events logged to audit table (login, logout, failed attempt, password reset, role change)

---

## 8. Out of Scope (Phase 1)

- SSO / OAuth (Google Workspace login) — architect to add later
- Two-factor authentication — architect to add later
- Mobile app session handling

---

## 9. Dependencies

None. This module must be completed before any other module begins.
