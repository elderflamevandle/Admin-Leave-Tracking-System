"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { CSVExportButton } from "@/components/shared/csv-export-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AllTimelogsPage() {
  const { authFetch } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["timelog-all", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ all: "true", limit: "50", ...(from && { from }), ...(to && { to }) });
      const res = await authFetch(`/api/timelog?${params}`);
      return res.json();
    },
  });

  const columns = [
    { key: "user", header: "Employee", render: (r: Record<string, unknown>) => (r.user as { fullName: string })?.fullName },
    { key: "logDate", header: "Date", render: (r: Record<string, unknown>) => new Date(r.logDate as string).toLocaleDateString() },
    { key: "loginTime", header: "Login" },
    { key: "logoutTime", header: "Logout", render: (r: Record<string, unknown>) => String(r.logoutTime ?? "—") },
    { key: "hoursWorked", header: "Hours", render: (r: Record<string, unknown>) => r.hoursWorked ? `${r.hoursWorked}h` : "—" },
    { key: "isAmended", header: "", render: (r: Record<string, unknown>) => r.isAmended ? <span className="text-xs text-orange-500">Amended</span> : null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Time Logs</h1>
        <CSVExportButton type="timelog" />
      </div>
      <div className="flex gap-4">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No time log entries found" />
    </div>
  );
}
