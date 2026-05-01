"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { toast } from "sonner";
import { Trash2, Plus, Palmtree } from "lucide-react";

type Holiday = {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  createdAt: string;
};

export default function HolidaysPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", date: "", isRecurring: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const res = await authFetch("/api/admin/holidays");
      const json = await res.json();
      return json.data as Holiday[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/admin/holidays", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("Holiday added");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setForm({ name: "", date: "", isRecurring: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Holiday removed");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const holidays = data ?? [];
  const grouped = holidays.reduce<Record<string, Holiday[]>>((acc, h) => {
    const year = h.date.slice(0, 4);
    (acc[year] = acc[year] ?? []).push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palmtree className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-slate-900">Holiday Calendar</h1>
      </div>
      <p className="text-sm text-slate-500">
        Holidays are excluded from working-day calculations in leave requests.
        Recurring holidays repeat every year on the same date.
      </p>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Add Holiday</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Holiday Name</Label>
              <Input
                placeholder="e.g. Republic Day"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="w-40 space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="recurring"
                checked={form.isRecurring}
                onCheckedChange={(v) => setForm({ ...form, isRecurring: Boolean(v) })}
              />
              <Label htmlFor="recurring" className="cursor-pointer text-sm">Recurring</Label>
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name || !form.date}
            >
              <Plus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-8">Loading…</div>
      ) : holidays.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-400">
          No holidays configured yet
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, hs]) => (
            <div key={year}>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">{year}</h2>
              <div className="space-y-2">
                {hs.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                    <span className="text-lg">🌴</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(h.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    {h.isRecurring && (
                      <Badge variant="secondary" className="text-[10px]">Recurring</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => setDeleteId(h.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Remove Holiday"
        description="Remove this holiday from the calendar? It will no longer be excluded from leave calculations."
        confirmLabel="Remove"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
