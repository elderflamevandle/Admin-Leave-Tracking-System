# PRD-05 — Future Modules: Placeholder Specifications
**Project:** Internal VC Firm CRM Platform  
**Module:** Phase 2+ Modules — VC Pipeline, Outreach, Research, Operations, Projects  
**Version:** 0.1 (Placeholder — full PRDs to follow in Phase 2)  
**Status:** Defined, not yet in development  
**Build phase:** Phase 2+

---

## Purpose of This Document

This document defines the structure, routes, and placeholder UI for all modules that are scoped but not built in Phase 1. Claude Code should use this to:

1. Register all routes now (so links don't 404)
2. Render placeholder pages with correct layout and navigation
3. Scaffold data models early so Phase 2 can add functionality without schema conflicts
4. Ensure the sidebar navigation is fully defined with all future items

---

## Module Index

| Module | Route prefix | Phase | Roles with access |
|---|---|---|---|
| Deal Pipeline | `/pipeline` | 2 | Admin, Analyst |
| Lead Outreach | `/outreach` | 2 | Admin, Analyst |
| Research Hub | `/research` | 2 | Admin, Analyst, Operations (view) |
| Legal Vault | `/legal` | 2 | Admin, Operations |
| Finance & Accounting | `/finance` | 2 | Admin, Operations |
| Document Store | `/documents` | 2 | Admin, Operations, Analyst (view) |
| Project Planner | `/projects` | 2 | Admin, Analyst, Operations (view) |
| Notifications (full) | `/notifications` | 2 | All roles |
| Global Search | `/search` | 2 | All roles |

---

## 1. Deal Pipeline (`/pipeline`)

### Purpose
Track investment opportunities from sourcing through to close. Each deal moves through a defined stage pipeline.

### Planned Stages
Sourcing → Initial Review → Screening → Partner Meeting → Due Diligence → Term Sheet → Closed Won / Closed Lost

### Planned Features
- Kanban board view (drag-and-drop cards between stages)
- List/table view
- Deal record: company name, sector, stage, deal size, thesis fit score, assigned analyst, next action, notes, documents
- Deal timeline/activity history
- Linked contacts (founders, advisors)
- Document attachments per deal
- Filters: sector, stage, assigned analyst, deal size range, date added

### Placeholder Routes to Register
```
GET  /pipeline              → Placeholder page
GET  /pipeline/:id          → Placeholder page
GET  /pipeline/new          → Placeholder page
```

### Scaffold Data Model
```
deals
  id                UUID
  company_name      string
  sector            string
  stage             enum (sourcing | review | screening | partner_meeting | diligence | term_sheet | closed_won | closed_lost)
  deal_size         decimal (nullable)
  thesis_fit        integer 1-5 (nullable)
  assigned_to       FK → users.id
  lead_contact      FK → contacts.id (nullable)
  notes             text
  created_by        FK → users.id
  created_at        timestamp
  updated_at        timestamp
```

---

## 2. Lead Outreach (`/outreach`)

### Purpose
Manage outreach to founders, LPs, advisors, and potential portfolio companies. Track contacts, outreach sequences, and communication history.

### Planned Features
- Contact database (founders, LPs, advisors, service providers)
- Outreach sequences: define multi-step email/call sequences
- Contact record: name, company, role, email, phone, LinkedIn, status, last contacted, notes
- Interaction log: log calls, emails, meetings per contact
- Status tracking: To Contact / Contacted / In Discussion / Relationship / Not Interested
- Bulk import via CSV
- Link contacts to deals

### Placeholder Routes
```
GET  /outreach              → Placeholder page
GET  /outreach/contacts     → Placeholder page
GET  /outreach/contacts/:id → Placeholder page
GET  /outreach/sequences    → Placeholder page
```

### Scaffold Data Model
```
contacts
  id                UUID
  full_name         string
  company           string
  role              string
  email             string
  phone             string (nullable)
  linkedin_url      string (nullable)
  status            enum (to_contact | contacted | in_discussion | relationship | not_interested)
  last_contacted_at timestamp (nullable)
  notes             text
  tags              array of strings
  created_by        FK → users.id
  created_at        timestamp
  updated_at        timestamp

contact_interactions
  id                UUID
  contact_id        FK → contacts.id
  user_id           FK → users.id
  type              enum (email | call | meeting | linkedin | other)
  notes             text
  interaction_date  timestamp
  created_at        timestamp
```

---

## 3. Research Hub (`/research`)

### Purpose
Centralised repository for investment research — market maps, sector memos, company profiles, theses, and competitive analyses.

### Planned Features
- Research document library (upload + rich text editor)
- Tagging by sector, company, geography, thesis theme
- Version history on documents
- Search by keyword, tag, author, date
- Link research to deals
- Access: Analyst and Admin full access; Operations view-only

### Placeholder Routes
```
GET  /research              → Placeholder page
GET  /research/:id          → Placeholder page
GET  /research/new          → Placeholder page
```

### Scaffold Data Model
```
research_docs
  id                UUID
  title             string
  content           text (rich text / markdown)
  tags              array of strings
  linked_deal_id    FK → deals.id (nullable)
  author_id         FK → users.id
  version           integer (default 1)
  is_published      boolean
  created_at        timestamp
  updated_at        timestamp
```

---

## 4. Legal Vault (`/legal`)

### Purpose
Secure storage for all legal documents: NDAs, term sheets, shareholder agreements, employment contracts, fund docs.

### Planned Features
- Upload and organise documents by category and deal/company
- Document metadata: name, type, date signed, parties involved, expiry date
- Search by name, type, company, date
- Access log: who viewed/downloaded each document
- Expiry alerts (e.g., NDA expiring in 30 days)
- Access: Admin + Operations only

### Placeholder Routes
```
GET  /legal                 → Placeholder page
GET  /legal/:id             → Placeholder page
GET  /legal/upload          → Placeholder page
```

### Scaffold Data Model
```
legal_documents
  id                UUID
  title             string
  doc_type          enum (nda | term_sheet | sha | employment | fund_doc | other)
  file_url          string
  file_size         integer
  related_company   string (nullable)
  related_deal_id   FK → deals.id (nullable)
  signed_date       date (nullable)
  expiry_date       date (nullable)
  parties           array of strings
  uploaded_by       FK → users.id
  created_at        timestamp
  updated_at        timestamp
```

---

## 5. Finance & Accounting (`/finance`)

### Purpose
Track firm expenses, invoices, and generate basic financial reports. Not a full accounting system — a lightweight internal tracker.

### Planned Features
- Expense logging: amount, category, description, receipt upload, date, submitted by
- Invoice tracking: vendor, amount, due date, payment status
- Approval workflow: employee submits → admin approves
- Monthly/quarterly spend reports by category
- Export to CSV/Excel
- Access: Admin + Operations only

### Placeholder Routes
```
GET  /finance               → Placeholder page
GET  /finance/expenses      → Placeholder page
GET  /finance/invoices      → Placeholder page
GET  /finance/reports       → Placeholder page
```

### Scaffold Data Model
```
expenses
  id                UUID
  submitted_by      FK → users.id
  amount            decimal
  currency          string (default: USD)
  category          enum (travel | software | legal | marketing | office | other)
  description       text
  receipt_url       string (nullable)
  expense_date      date
  status            enum (pending | approved | rejected)
  reviewed_by       FK → users.id (nullable)
  created_at        timestamp

invoices
  id                UUID
  vendor            string
  amount            decimal
  currency          string
  due_date          date
  paid_date         date (nullable)
  status            enum (unpaid | paid | overdue | cancelled)
  notes             text (nullable)
  created_by        FK → users.id
  created_at        timestamp
```

---

## 6. Document Store (`/documents`)

### Purpose
General shared file storage for documents that don't fit into Legal or Research — templates, presentations, policies, onboarding materials.

### Planned Features
- Folder/category structure
- Upload any file type
- Access control per folder (set by admin)
- Version history
- Search by name, tag, uploader
- Access: Admin full; Operations full; Analyst view-only

### Placeholder Routes
```
GET  /documents             → Placeholder page
GET  /documents/:folder_id  → Placeholder page
GET  /documents/file/:id    → Placeholder page
```

### Scaffold Data Model
```
doc_folders
  id                UUID
  name              string
  parent_folder_id  FK → doc_folders.id (nullable)
  access_roles      array of strings
  created_by        FK → users.id
  created_at        timestamp

doc_files
  id                UUID
  folder_id         FK → doc_folders.id
  name              string
  file_url          string
  file_size         integer
  file_type         string
  version           integer
  uploaded_by       FK → users.id
  created_at        timestamp
  updated_at        timestamp
```

---

## 7. Project Planner (`/projects`)

### Purpose
Allow structured project planning — milestones, tasks, owners, timelines. Primarily used by admin and analysts to plan VC-adjacent projects (e.g., sector research sprints, LP reporting, portfolio reviews).

### Planned Features
- Create project: name, description, start date, end date, owner
- Milestone-based timeline view (Gantt-lite)
- Task list per milestone: title, assigned to, due date, status, notes
- Project status: Planning / In Progress / On Hold / Completed
- Team members list per project
- Task status: To Do / In Progress / Done / Blocked

### Placeholder Routes
```
GET  /projects              → Placeholder page
GET  /projects/:id          → Placeholder page
GET  /projects/new          → Placeholder page
GET  /projects/:id/tasks    → Placeholder page
```

### Scaffold Data Model
```
projects
  id                UUID
  name              string
  description       text
  status            enum (planning | in_progress | on_hold | completed)
  start_date        date
  end_date          date
  owner_id          FK → users.id
  created_at        timestamp
  updated_at        timestamp

project_members
  id                UUID
  project_id        FK → projects.id
  user_id           FK → users.id
  role              string (e.g., lead, contributor, observer)

project_milestones
  id                UUID
  project_id        FK → projects.id
  title             string
  due_date          date
  status            enum (pending | completed)
  sort_order        integer

project_tasks
  id                UUID
  milestone_id      FK → project_milestones.id
  title             string
  description       text
  assigned_to       FK → users.id (nullable)
  due_date          date (nullable)
  status            enum (todo | in_progress | done | blocked)
  notes             text (nullable)
  created_at        timestamp
  updated_at        timestamp
```

---

## 8. Implementation Instructions for Claude Code

### Routing
Register ALL routes above in Phase 1. Each unbuilt route should render a `<PlaceholderPage>` component:

```jsx
// components/PlaceholderPage.jsx
export default function PlaceholderPage({ moduleName, icon }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h2>{moduleName}</h2>
      <p>This module is coming in a future platform update.</p>
      <a href="/dashboard">← Back to Dashboard</a>
    </div>
  );
}

// Usage:
<Route path="/pipeline" element={<PlaceholderPage moduleName="Deal Pipeline" icon="📊" />} />
<Route path="/outreach" element={<PlaceholderPage moduleName="Lead Outreach" icon="📬" />} />
// etc.
```

### Database
Run migrations for ALL scaffold data models above alongside Phase 1 models — empty tables are fine. This allows Phase 2 to add columns and relationships rather than create tables from scratch, which avoids painful migrations later.

### Navigation
Sidebar should include all future nav items (as defined in PRD-02) with a "coming soon" visual state — not hidden, just visually inactive with a badge.

### Environment flag (optional but recommended)
```env
FEATURE_PIPELINE=false
FEATURE_OUTREACH=false
FEATURE_RESEARCH=false
FEATURE_LEGAL=false
FEATURE_FINANCE=false
FEATURE_DOCUMENTS=false
FEATURE_PROJECTS=false
```

Use feature flags to control whether a nav item routes to the placeholder or the real module. When Phase 2 development is complete for a module, flip its flag to `true`.
