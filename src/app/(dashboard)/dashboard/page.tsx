"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/stat-card";
import { PlaceholderWidget } from "@/components/dashboard/placeholder-widget";
import { Users, CalendarOff, Clock, Activity } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { roleName } = useRole();

  if (roleName === "admin") return <AdminDashboard />;
  return <EmployeeDashboard />;
}

function AdminDashboard() {
  const { authFetch } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, leaveRes] = await Promise.all([
        authFetch("/api/users?status=active&limit=1"),
        authFetch("/api/leave?all=true&status=pending&limit=1"),
      ]);
      const users = await usersRes.json();
      const leave = await leaveRes.json();
      return {
        totalEmployees: users.meta?.total ?? 0,
        pendingLeave: leave.meta?.total ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? "—"} icon={<Users className="h-6 w-6" />} />
        <StatCard label="Pending Leave Requests" value={stats?.pendingLeave ?? "—"} icon={<CalendarOff className="h-6 w-6" />} />
        <StatCard label="Active Today" value="—" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Activities This Week" value="—" icon={<Activity className="h-6 w-6" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PlaceholderWidget title="Deal Pipeline Overview" />
        <PlaceholderWidget title="Financial Summary" />
        <PlaceholderWidget title="Project Status" />
        <PlaceholderWidget title="Outreach Activity" />
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome back, {user?.fullName?.split(" ")[0]}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Leave Balance" value={`${0} days`} icon={<CalendarOff className="h-6 w-6" />} />
        <StatCard label="Hours This Week" value="—" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Activities Logged" value="—" icon={<Activity className="h-6 w-6" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PlaceholderWidget title="VC Pipeline" />
        <PlaceholderWidget title="Project Tasks" />
      </div>
    </div>
  );
}
