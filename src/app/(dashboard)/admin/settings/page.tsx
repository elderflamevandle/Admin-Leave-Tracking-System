"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceholderWidget } from "@/components/dashboard/placeholder-widget";
import { toast } from "sonner";

export default function SettingsPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await authFetch("/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const res = await authFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(updates) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("Settings saved"); queryClient.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-6 text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Firm Name</Label>
            <Input value={String(form.firm_name ?? "")} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} />
          </div>
          <Button onClick={() => save.mutate({ firm_name: form.firm_name })} disabled={save.isPending}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Leave Policy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Annual Leave Days</Label>
            <Input type="number" value={Number(form.default_leave_days ?? 20)} onChange={(e) => setForm({ ...form, default_leave_days: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>Self-edit Window (days)</Label>
            <Input type="number" value={Number(form.self_edit_window_days ?? 7)} onChange={(e) => setForm({ ...form, self_edit_window_days: Number(e.target.value) })} />
          </div>
          <Button onClick={() => save.mutate({ default_leave_days: form.default_leave_days, self_edit_window_days: form.self_edit_window_days })} disabled={save.isPending}>Save</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-500">Phase 2 Settings</p>
        <PlaceholderWidget title="Email & Notification Settings" />
        <PlaceholderWidget title="Integrations" />
        <PlaceholderWidget title="Security Policy" />
      </div>
    </div>
  );
}
