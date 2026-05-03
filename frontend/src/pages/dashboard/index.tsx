import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { Users, CalendarOff, Clock, Activity, BarChart2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { roleName } = useRole();

  if (roleName === "admin") return <AdminDashboard />;
  if (roleName === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}

function AdminDashboard() {
  const { authFetch } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, leaveRes, reportRes] = await Promise.all([
        authFetch("/api/v1/users?status=active&limit=1"),
        authFetch("/api/v1/leave?all=true&status=pending&limit=50"),
        authFetch(`/api/v1/admin/reports?year=${new Date().getFullYear()}`),
      ]);
      const users = await usersRes.json();
      const leave = await leaveRes.json();
      const report = await reportRes.json();
      return {
        totalEmployees: users.meta?.total ?? 0,
        pendingLeave: leave.meta?.total ?? 0,
        approvedDays: report.data?.summary?.totalApprovedDays ?? 0,
        pendingRequests: leave.data ?? [],
      };
    },
  });

  const pendingRequests: Record<string, unknown>[] = stats?.pendingRequests ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/reports"><BarChart2 className="mr-2 h-4 w-4" />Reports</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? "—"} icon={<Users className="h-6 w-6" />} />
        <StatCard label="Pending Leave" value={stats?.pendingLeave ?? "—"} icon={<CalendarOff className="h-6 w-6" />} />
        <StatCard label="Leave Days Approved" value={stats?.approvedDays ?? "—"} icon={<CheckCircle className="h-6 w-6" />} />
        <StatCard label="Activities This Week" value="—" icon={<Activity className="h-6 w-6" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Pending Leave Requests
              <Link to="/leave/manage" className="text-xs text-blue-600 font-normal hover:underline">View all →</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.slice(0, 5).map((r) => (
                  <div key={r.id as string} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{(r.user as { fullName: string })?.fullName ?? "—"}</span>
                      <span className="ml-2 text-slate-400 text-xs">{String(r.leaveType)} · {String(r.workingDays)}d</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">pending</Badge>
                  </div>
                ))}
                {pendingRequests.length > 5 && (
                  <p className="text-xs text-slate-400 pt-1">+{pendingRequests.length - 5} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/leave/manage",    label: "Review Leave Requests",  icon: <CalendarOff className="h-4 w-4" /> },
              { to: "/leave/calendar",  label: "Leave Calendar",         icon: <Clock className="h-4 w-4" /> },
              { to: "/admin/users",     label: "Manage Employees",       icon: <Users className="h-4 w-4" /> },
              { to: "/admin/reports",   label: "Analytics & Reports",    icon: <BarChart2 className="h-4 w-4" /> },
              { to: "/admin/holidays",  label: "Manage Holidays",        icon: <XCircle className="h-4 w-4" /> },
            ].map(({ to, label, icon }) => (
              <Link key={to} to={to} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                <span className="text-slate-400">{icon}</span>
                {label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const { user, authFetch } = useAuth();

  const { data: teamLeave } = useQuery({
    queryKey: ["team-leave-pending"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/leave?team=true&status=pending&limit=50");
      return res.json();
    },
  });

  const pendingCount = teamLeave?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome, {user?.fullName?.split(" ")[0]}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Team Leave Pending" value={pendingCount} icon={<CalendarOff className="h-6 w-6" />} />
        <StatCard label="Hours This Week" value="—" icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Activities Logged" value="—" icon={<Activity className="h-6 w-6" />} />
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/leave/manage">Review Team Leave</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/leave/calendar">Leave Calendar</Link>
        </Button>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user, authFetch } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/users/me");
      return res.json();
    },
  });

  const { data: timeData } = useQuery({
    queryKey: ["my-timelog-week"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/timelog?limit=7");
      return res.json();
    },
  });

  const leaveBalance = meData?.data?.leaveBalance ?? 0;
  const hoursThisWeek = (timeData?.data ?? []).reduce(
    (sum: number, e: { hoursWorked?: string | null }) => sum + Number(e.hoursWorked ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome back, {user?.fullName?.split(" ")[0]}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Leave Balance" value={`${leaveBalance} days`} icon={<CalendarOff className="h-6 w-6" />} />
        <StatCard label="Hours This Week" value={hoursThisWeek > 0 ? `${hoursThisWeek.toFixed(1)}h` : "—"} icon={<Clock className="h-6 w-6" />} />
        <StatCard label="Activities Logged" value="—" icon={<Activity className="h-6 w-6" />} />
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/leave">Apply for Leave</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/timelog">Log Time</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/leave/calendar">Leave Calendar</Link>
        </Button>
      </div>
    </div>
  );
}
