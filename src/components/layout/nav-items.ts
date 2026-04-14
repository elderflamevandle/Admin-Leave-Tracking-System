import type { RoleName, PermissionKey } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
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
