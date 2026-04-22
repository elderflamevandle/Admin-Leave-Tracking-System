export type RoleName = "admin" | "analyst" | "operations";

export type PermissionKey =
  // VC Modules
  | "pipeline.view" | "pipeline.create" | "pipeline.edit" | "pipeline.delete"
  | "outreach.view" | "outreach.create" | "outreach.edit" | "outreach.delete"
  | "research.view" | "research.create" | "research.edit" | "research.delete"
  // Operations Modules
  | "legal.view" | "legal.create" | "legal.edit" | "legal.delete"
  | "finance.view" | "finance.create" | "finance.edit" | "finance.delete"
  | "documents.view" | "documents.create" | "documents.edit" | "documents.delete"
  // People Modules
  | "leave.view_own" | "leave.apply" | "leave.approve_all"
  | "timelog.view_own" | "timelog.view_all" | "timelog.edit_all"
  | "activitylog.view_own" | "activitylog.view_all"
  // Admin Modules
  | "users.view" | "users.create" | "users.edit" | "users.deactivate"
  | "roles.manage" | "audit.view" | "settings.manage";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  roleName: RoleName;
  permissions: PermissionKey[];
  department: string | null;
  avatarUrl: string | null;
  forcePasswordChange: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: RoleName;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogInput {
  userId: string;
  eventKey: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  module: string;
}
