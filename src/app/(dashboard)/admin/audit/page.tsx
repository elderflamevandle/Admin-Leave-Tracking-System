"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CSVExportButton } from "@/components/shared/csv-export-button";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePagination } from "@/hooks/use-pagination";

export default function AuditLogPage() {
  const { authFetch } = useAuth();
  const { page, setPage } = usePagination();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", page, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25", ...(from && { from }), ...(to && { to }) });
      const res = await authFetch(`/api/admin/audit?${params}`);
      return res.json();
    },
  });

  const columns = [
    { key: "createdAt", header: "Time", render: (r: Record<string, unknown>) => new Date(r.createdAt as string).toLocaleString() },
    { key: "user", header: "User", render: (r: Record<string, unknown>) => (r.user as { fullName: string })?.fullName },
    { key: "module", header: "Module", render: (r: Record<string, unknown>) => <Badge variant="outline" className="text-xs">{String(r.module)}</Badge> },
    { key: "eventKey", header: "Action", render: (r: Record<string, unknown>) => <span className="font-mono text-xs">{String(r.eventKey)}</span> },
    { key: "details", header: "Details", render: (r: Record<string, unknown>) => <span className="line-clamp-1 text-sm">{String(r.details)}</span> },
    { key: "ipAddress", header: "IP", render: (r: Record<string, unknown>) => <span className="text-xs text-slate-400">{String(r.ipAddress)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <CSVExportButton type="audit" />
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
      <DataTable columns={columns} data={data?.data ?? []} page={page} totalPages={data?.meta?.totalPages} onPageChange={setPage} isLoading={isLoading} emptyMessage="No audit events found" />
    </div>
  );
}
