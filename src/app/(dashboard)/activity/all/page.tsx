"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { CSVExportButton } from "@/components/shared/csv-export-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AllActivityPage() {
  const { authFetch } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["activity-all", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ all: "true", limit: "50", ...(from && { from }), ...(to && { to }) });
      const res = await authFetch(`/api/activity?${params}`);
      return res.json();
    },
  });

  const columns = [
    { key: "user", header: "Employee", render: (r: Record<string, unknown>) => (r.user as { fullName: string })?.fullName },
    { key: "logDate", header: "Date", render: (r: Record<string, unknown>) => new Date(r.logDate as string).toLocaleDateString() },
    { key: "activities", header: "Activities", render: (r: Record<string, unknown>) => <span className="line-clamp-1 text-sm">{String(r.activities)}</span> },
    { key: "tags", header: "Tags", render: (r: Record<string, unknown>) => (
      <div className="flex flex-wrap gap-1">
        {(r.tags as string[]).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Activity Logs</h1>
        <CSVExportButton type="activity" />
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
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No activity logs found" />
    </div>
  );
}
