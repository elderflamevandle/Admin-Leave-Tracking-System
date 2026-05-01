"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, CalendarOff, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#ef4444", "#a855f7", "#64748b"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

export default function ReportsPage() {
  const { authFetch } = useAuth();
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", year],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/reports?year=${year}`);
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Loading…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard
              label="Total Employees"
              value={data?.summary?.totalEmployees ?? "—"}
              icon={<Users className="h-6 w-6" />}
            />
            <StatCard
              label="Leave Days Approved"
              value={data?.summary?.totalApprovedDays ?? "—"}
              icon={<CalendarOff className="h-6 w-6" />}
            />
            <StatCard
              label="Pending Requests"
              value={data?.summary?.pendingLeaves ?? "—"}
              icon={<TrendingUp className="h-6 w-6" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Monthly leave chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Monthly Leave Days ({year})</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.leaveByMonth ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="approved" name="Approved" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leave by type pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Leave by Type ({year})</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {data?.leaveByType?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.leaveByType}
                        dataKey="days"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.leaveByType.map((_: unknown, index: number) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                      <Tooltip formatter={(val) => [`${val} days`]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">No data for {year}</p>
                )}
              </CardContent>
            </Card>

            {/* Leave by department */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Leave Days by Department ({year})</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.leaveByDepartment?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={data.leaveByDepartment}
                      layout="vertical"
                      margin={{ top: 4, right: 20, bottom: 0, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="days" name="Days" fill="#6366f1" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">No approved leave data for {year}</p>
                )}
              </CardContent>
            </Card>

            {/* Overtime days per month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Overtime Days ({">"} 8h) per Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.overtimeByMonth ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="overtimeDays" name="Overtime Days" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
