"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, CalendarOff, UserPlus, ScrollText } from "lucide-react";

export default function AdminHomePage() {
  const { authFetch } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [usersRes, leaveRes, auditRes] = await Promise.all([
        authFetch("/api/users?status=active&limit=1"),
        authFetch("/api/leave?all=true&status=pending&limit=1"),
        authFetch("/api/admin/audit?limit=10"),
      ]);
      const users = await usersRes.json();
      const leave = await leaveRes.json();
      const audit = await auditRes.json();
      return { totalActive: users.meta?.total ?? 0, pendingLeave: leave.meta?.total ?? 0, recentAudit: audit.data ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Employees" value={stats?.totalActive ?? "—"} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Pending Leave" value={stats?.pendingLeave ?? "—"} icon={<CalendarOff className="h-5 w-5" />} />
        <StatCard label="Roles" value={3} />
        <StatCard label="Total Settings" value={15} />
      </div>

      <div className="flex gap-3">
        <Button asChild><Link href="/admin/users/new"><UserPlus className="mr-2 h-4 w-4" /> Create User</Link></Button>
        <Button variant="outline" asChild><Link href="/leave/manage"><CalendarOff className="mr-2 h-4 w-4" /> Review Leave</Link></Button>
        <Button variant="outline" asChild><Link href="/admin/audit"><ScrollText className="mr-2 h-4 w-4" /> Audit Log</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Audit Events</CardTitle></CardHeader>
        <CardContent>
          {(stats?.recentAudit ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No recent events</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recentAudit as Record<string, unknown>[]).map((log) => (
                <div key={log.id as string} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0">{String(log.module)}</Badge>
                  <span className="flex-1 text-slate-600">{String(log.details)}</span>
                  <span className="text-slate-400 text-xs">{new Date(log.createdAt as string).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
