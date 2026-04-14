"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { CSVExportButton } from "@/components/shared/csv-export-button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LeaveManagePage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [approveId, setApproveId] = useState<string | null>(null);

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["leave-pending"],
    queryFn: async () => {
      const res = await authFetch("/api/leave?all=true&status=pending&limit=50");
      return res.json();
    },
  });

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ["leave-all"],
    queryFn: async () => {
      const res = await authFetch("/api/leave?all=true&limit=50");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/leave/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("Leave approved"); queryClient.invalidateQueries({ queryKey: ["leave-pending"] }); queryClient.invalidateQueries({ queryKey: ["leave-all"] }); setApproveId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await authFetch(`/api/leave/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("Leave rejected"); queryClient.invalidateQueries({ queryKey: ["leave-pending"] }); queryClient.invalidateQueries({ queryKey: ["leave-all"] }); setRejectId(null); setRejectNote(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingColumns = [
    { key: "user", header: "Employee", render: (r: Record<string, unknown>) => (r.user as { fullName: string })?.fullName },
    { key: "leaveType", header: "Type", render: (r: Record<string, unknown>) => <Badge variant="outline">{String(r.leaveType)}</Badge> },
    { key: "startDate", header: "From", render: (r: Record<string, unknown>) => new Date(r.startDate as string).toLocaleDateString() },
    { key: "endDate", header: "To", render: (r: Record<string, unknown>) => new Date(r.endDate as string).toLocaleDateString() },
    { key: "workingDays", header: "Days" },
    { key: "actions", header: "", render: (r: Record<string, unknown>) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setApproveId(r.id as string)}>Approve</Button>
        <Button size="sm" variant="outline" onClick={() => setRejectId(r.id as string)}>Reject</Button>
      </div>
    )},
  ];

  const allColumns = [
    { key: "user", header: "Employee", render: (r: Record<string, unknown>) => (r.user as { fullName: string })?.fullName },
    { key: "leaveType", header: "Type" },
    { key: "startDate", header: "From", render: (r: Record<string, unknown>) => new Date(r.startDate as string).toLocaleDateString() },
    { key: "workingDays", header: "Days" },
    { key: "status", header: "Status", render: (r: Record<string, unknown>) => (
      <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
        {String(r.status)}
      </Badge>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
        <CSVExportButton type="leave" />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingData?.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <DataTable columns={pendingColumns} data={pendingData?.data ?? []} isLoading={pendingLoading} emptyMessage="No pending requests" />
        </TabsContent>
        <TabsContent value="all">
          <DataTable columns={allColumns} data={allData?.data ?? []} isLoading={allLoading} emptyMessage="No leave requests" />
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={!!approveId}
        onClose={() => setApproveId(null)}
        onConfirm={() => approveId && approveMutation.mutate(approveId)}
        title="Approve Leave"
        description="Approve this leave request? Annual leave will be deducted from balance."
        confirmLabel="Approve"
        isLoading={approveMutation.isPending}
      />

      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectNote(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason for rejection</Label>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Required" />
            </div>
            <Button className="w-full" variant="destructive" onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, note: rejectNote })} disabled={!rejectNote || rejectMutation.isPending}>
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
