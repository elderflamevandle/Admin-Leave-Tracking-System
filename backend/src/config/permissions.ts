import type { PermissionKey, RoleName } from "../types";

// Single source of truth for role permissions.
// seed.ts imports this — the DB permissions column is kept in sync automatically.
export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
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
    "roles.manage", "audit.view", "settings.manage", "reports.view", "holidays.manage",
  ],
  manager: [
    "leave.view_own", "leave.apply", "leave.approve_team",
    "timelog.view_own",
    "activitylog.view_own",
    "users.view",
    "reports.view",
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

export function hasPermission(
  roleOrPermissions: RoleName | PermissionKey[],
  permission: PermissionKey
): boolean {
  if (Array.isArray(roleOrPermissions)) {
    return roleOrPermissions.includes(permission);
  }
  return (ROLE_PERMISSIONS[roleOrPermissions] ?? []).includes(permission);
}

export function getPermissionsForRole(role: RoleName): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getAllPermissionKeys(): PermissionKey[] {
  return ROLE_PERMISSIONS.admin;
}

export function isAdmin(role: RoleName): boolean {
  return role === "admin";
}
