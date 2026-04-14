"use client";

import { useAuthContext } from "@/providers/auth-provider";
import type { PermissionKey, RoleName } from "@/types";

export function useRole() {
  const { user } = useAuthContext();

  const roleName: RoleName | null = user?.roleName ?? null;

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    return (user.permissions as string[]).includes(permission);
  };

  const isAdmin = roleName === "admin";

  return { roleName, hasPermission, isAdmin };
}
