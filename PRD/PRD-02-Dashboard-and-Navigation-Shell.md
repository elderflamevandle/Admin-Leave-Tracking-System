# PRD-02 — Dashboard & Navigation Shell
**Project:** Internal VC Firm CRM Platform  
**Module:** Global Layout, Navigation & Role-based Dashboard  
**Version:** 1.0  
**Status:** Ready for development  
**Build phase:** Phase 1 (build immediately after PRD-01)

---

## 1. Purpose

This module defines the persistent application shell — the sidebar navigation, top bar, and the dashboard home screen. It is the first screen every user sees after login. Each role sees a different dashboard and a different set of navigation items. Future modules slot into this shell without requiring layout changes.

---

## 2. Application Shell Layout

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR                                                 │
│  [Logo / Firm Name]              [Notifications] [Avatar]│
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│  SIDEBAR     │  MAIN CONTENT AREA                        │
│  NAV         │  (rendered by each module/page)           │
│              │                                           │
│  [nav items] │                                           │
│              │                                           │
│  ──────────  │                                           │
│  [Profile]   │                                           │
│  [Settings]  │                                           │
│  [Logout]    │                                           │
└──────────────┴──────────────────────────────────────────┘
```

- Sidebar width: 240px (collapsible to 64px icon-only mode)
- Top bar height: 56px
- Sidebar is always visible on desktop; slide-in drawer on mobile
- Main content area scrolls independently

---

## 3. Navigation Items by Role

Navigation items render conditionally based on role. Locked sections are NOT shown — not greyed out.

### Admin Navigation
```
Dashboard
─── People & HR ───────────────
  Employee Directory
  Leave Management
  Time & Attendance
  Activity Logs
─── VC & Deals ─────────────── [placeholder - Phase 2]
  Pipeline              [coming soon badge]
  Outreach              [coming soon badge]
  Research              [coming soon badge]
─── Operations ─────────────── [placeholder - Phase 2]
  Legal Vault           [coming soon badge]
  Finance               [coming soon badge]
  Documents             [coming soon badge]
─── Projects ───────────────── [placeholder - Phase 2]
  Project Planner       [coming soon badge]
─── Admin ──────────────────────
  User Management
  Role & Permissions
  Audit Log
  Platform Settings
```

### Analyst Navigation
```
Dashboard
─── My Work ────────────────────
  My Time Log
  My Leave
  My Activity Log
─── VC & Deals ─────────────── [placeholder - Phase 2]
  Pipeline              [coming soon badge]
  Outreach              [coming soon badge]
  Research              [coming soon badge]
─── Projects ───────────────── [placeholder - Phase 2]
  Project Planner       [coming soon badge]
```

### Operations Navigation
```
Dashboard
─── My Work ────────────────────
  My Time Log
  My Leave
  My Activity Log
─── Operations ─────────────── [placeholder - Phase 2]
  Legal Vault           [coming soon badge]
  Finance               [coming soon badge]
  Documents             [coming soon badge]
─── Projects ───────────────── [placeholder - Phase 2]
  Project Planner       [coming soon badge]
```

---

## 4. Dashboard Screen by Role

The dashboard is a summary/home page. It shows relevant widgets and quick actions. Phase 2 module widgets are shown as locked placeholder cards.

### 4.1 Admin Dashboard

**Quick Stats Row** (always visible)
- Total employees
- Active today (clocked in)
- Pending leave requests
- Open user accounts

**Active Phase 1 Widgets**
- Recent activity log entries (last 5, across all employees)
- Pending leave approvals (action button)
- Employees currently clocked in
- Recent new user accounts created

**Placeholder Widgets (Phase 2 — shown as locked cards)**
```
┌──────────────────────────────────┐
│  🔒  Deal Pipeline               │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  Outreach Activity           │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  Finance Overview            │
│  Available in a future update    │
└──────────────────────────────────┘
```

### 4.2 Analyst Dashboard

**Quick Stats Row**
- My hours this week
- Leave balance remaining
- Tasks logged today

**Active Phase 1 Widgets**
- My time log this week (mini chart)
- My activity log (last 3 entries + quick add)
- My upcoming leave

**Placeholder Widgets (Phase 2)**
```
┌──────────────────────────────────┐
│  🔒  My Deal Pipeline            │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  My Outreach Queue           │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  Project Tasks               │
│  Available in a future update    │
└──────────────────────────────────┘
```

### 4.3 Operations Dashboard

**Quick Stats Row**
- My hours this week
- Leave balance remaining
- Documents uploaded this month

**Active Phase 1 Widgets**
- My time log this week
- My activity log (last 3 entries + quick add)
- My upcoming leave

**Placeholder Widgets (Phase 2)**
```
┌──────────────────────────────────┐
│  🔒  Legal Documents             │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  Finance Overview            │
│  Available in a future update    │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  🔒  Project Tasks               │
│  Available in a future update    │
└──────────────────────────────────┘
```

---

## 5. Top Bar Components

- **Left:** Firm logo + name (links to dashboard)
- **Center:** Global search bar (Phase 2 — render as inactive/placeholder in Phase 1 with tooltip "Coming soon")
- **Right:**
  - Notification bell with badge count (Phase 2 placeholder — bell icon only, no functionality)
  - Avatar/initials circle → dropdown: Profile, Settings, Logout

---

## 6. Profile Page (all roles)

Accessible from the avatar dropdown. Editable by the employee themselves.

Fields:
- Full name (editable)
- Email (read-only, admin changes only)
- Role (read-only, admin changes only)
- Department (editable)
- Profile photo upload
- Change password section (current password + new password + confirm)
- Last login timestamp (read-only)

---

## 7. "Coming Soon" Placeholder Page

All placeholder nav items link to a generic placeholder page:

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│              [Module Icon]                            │
│                                                       │
│         This module is coming soon.                   │
│   It will be available in a future platform update.   │
│                                                       │
│              [← Back to Dashboard]                    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 8. Responsiveness

- Desktop (≥1280px): Full sidebar + content
- Tablet (768–1279px): Collapsed icon sidebar + content
- Mobile (<768px): Hidden sidebar with hamburger toggle, drawer overlay

---

## 9. Technical Requirements

- Framework: React (or Next.js if SSR needed)
- Sidebar state (expanded/collapsed) persisted in localStorage
- Navigation active state reflects current route
- All protected routes wrapped in auth guard (redirects to login if no valid session)
- Role is read from auth context — no separate API call needed on each page
- Skeleton loaders on dashboard widgets while data fetches

---

## 10. Dependencies

- PRD-01 (Auth) must be complete — role context must be available before this module renders
- All other modules are children of this shell
