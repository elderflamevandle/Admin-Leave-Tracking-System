"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarOff, Plus } from "lucide-react";
import { toast } from "sonner";

export default function LeavePage() {
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveType: "", startDate: "", endDate: "", reason: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["my-leave"],
    queryFn: async () => {
      const res = await authFetch("/api/leave?limit=50");
      return res.json();
    },
  });

  const submitLeave = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/leave", { method: "POST", body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Leave request submitted");
      queryClient.invalidateQueries({ queryKey: ["my-leave"] });
      setShowForm(false);
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveRequests = data?.data ?? [];
  const pending = leaveRequests.filter((r: Record<string, unknown>) => r.status === "pending").length;
  const approved = leaveRequests.filter((r: Record<string, unknown>) => r.status === "approved").length;

  const columns = [
    { key: "leaveType", header: "Type", render: (r: Record<string, unknown>) => <Badge variant="outline">{String(r.leaveType)}</Badge> },
    { key: "startDate", header: "From", render: (r: Record<string, unknown>) => new Date(r.startDate as string).toLocaleDateString() },
    { key: "endDate", header: "To", render: (r: Record<string, unknown>) => new Date(r.endDate as string).toLocaleDateString() },
    { key: "workingDays", header: "Days" },
    { key: "status", header: "Status", render: (r: Record<string, unknown>) => {
      const colors: Record<string, string> = { pending: "secondary", approved: "default", rejected: "destructive", cancelled: "outline" };
      return <Badge variant={(colors[r.status as string] ?? "secondary") as "default" | "secondary" | "destructive" | "outline"}>{String(r.status)}</Badge>;
    }},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Leave</h1>
        <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Apply for Leave</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Leave Balance" value={`${user ? 0 : "—"} days`} icon={<CalendarOff className="h-5 w-5" />} />
        <StatCard label="Pending Requests" value={pending} />
        <StatCard label="Approved This Year" value={approved} />
      </div>

      <DataTable columns={columns} data={leaveRequests} isLoading={isLoading} emptyMessage="No leave requests yet" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => submitLeave.mutate()} disabled={submitLeave.isPending || !form.leaveType || !form.startDate || !form.endDate}>
              {submitLeave.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
