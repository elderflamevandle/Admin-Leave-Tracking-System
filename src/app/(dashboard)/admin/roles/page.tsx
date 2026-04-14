"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import type { RoleName } from "@/types";
import { Check, Minus } from "lucide-react";

const PERMISSION_GROUPS = [
  { label: "VC & Deals", keys: ["pipeline", "outreach", "research"] },
  { label: "Operations", keys: ["legal", "finance", "documents"] },
  { label: "People — Leave", keys: ["leave"] },
  { label: "People — Time", keys: ["timelog"] },
  { label: "People — Activity", keys: ["activitylog"] },
  { label: "Admin", keys: ["users", "roles", "audit", "settings"] },
];

function PermissionMatrix({ role }: { role: RoleName }) {
  const permissions = ROLE_PERMISSIONS[role];

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-sm font-semibold text-slate-500">{group.label}</p>
          <div className="rounded-md border divide-y">
            {permissions
              .filter((p) => group.keys.some((k) => p.startsWith(k)))
              .map((perm) => (
                <div key={perm} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{perm}</span>
                </div>
              ))}
            {permissions.filter((p) => group.keys.some((k) => p.startsWith(k))).length === 0 && (
              <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400">
                <Minus className="h-4 w-4" />
                <span>No permissions for this module</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RolesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">Read-only view. To modify permissions, contact your system administrator.</p>
      </div>

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin">Admin <Badge variant="secondary" className="ml-1">All</Badge></TabsTrigger>
          <TabsTrigger value="analyst">Analyst</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>
        <TabsContent value="admin"><PermissionMatrix role="admin" /></TabsContent>
        <TabsContent value="analyst"><PermissionMatrix role="analyst" /></TabsContent>
        <TabsContent value="operations"><PermissionMatrix role="operations" /></TabsContent>
      </Tabs>
    </div>
  );
}
