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
  return ROLE_PERMISSIONS.admin;
}

export function isAdmin(role: RoleName): boolean {
  return role === "admin";
}

export { ROLE_PERMISSIONS };
