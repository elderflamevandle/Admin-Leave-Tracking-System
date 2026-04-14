"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDateISO } from "@/lib/utils";

export default function TimelogPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const today = formatDateISO(new Date());
  const [form, setForm] = useState({ logDate: today, loginTime: "", logoutTime: "", breakMinutes: "0", notes: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["my-timelog"],
    queryFn: async () => {
      const res = await authFetch("/api/timelog?limit=30");
      return res.json();
    },
  });

  const submitEntry = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/timelog", {
        method: "POST",
        body: JSON.stringify({ ...form, breakMinutes: Number(form.breakMinutes) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Time log saved");
      queryClient.invalidateQueries({ queryKey: ["my-timelog"] });
      setForm({ logDate: today, loginTime: "", logoutTime: "", breakMinutes: "0", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = [
    { key: "logDate", header: "Date", render: (r: Record<string, unknown>) => new Date(r.logDate as string).toLocaleDateString() },
    { key: "loginTime", header: "Login" },
    { key: "logoutTime", header: "Logout", render: (r: Record<string, unknown>) => String(r.logoutTime ?? "—") },
    { key: "breakMinutes", header: "Break (min)" },
    { key: "hoursWorked", header: "Hours", render: (r: Record<string, unknown>) => r.hoursWorked ? `${r.hoursWorked}h` : "—" },
    { key: "isAmended", header: "", render: (r: Record<string, unknown>) => r.isAmended ? <span className="text-xs text-orange-500">Amended</span> : null },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Time Log</h1>

      <Card>
        <CardHeader><CardTitle>Log Entry</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.logDate} onChange={(e) => setForm({ ...form, logDate: e.target.value })} max={today} />
            </div>
            <div className="space-y-2">
              <Label>Login Time</Label>
              <Input type="time" value={form.loginTime} onChange={(e) => setForm({ ...form, loginTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Logout Time</Label>
              <Input type="time" value={form.logoutTime} onChange={(e) => setForm({ ...form, logoutTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Break (min)</Label>
              <Input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} min="0" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <Button className="mt-4" onClick={() => submitEntry.mutate()} disabled={submitEntry.isPending || !form.loginTime}>
            {submitEntry.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No time log entries yet"
      />
    </div>
  );
}
