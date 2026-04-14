"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateISO } from "@/lib/utils";

const DEFAULT_TAGS = ["Deal Work", "Research", "Operations", "Admin", "BD", "Other"];

export default function ActivityPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const today = formatDateISO(new Date());
  const [form, setForm] = useState({ logDate: today, activities: "", blockers: "", tags: [] as string[] });

  const { data, isLoading } = useQuery({
    queryKey: ["my-activity"],
    queryFn: async () => {
      const res = await authFetch("/api/activity?limit=30");
      return res.json();
    },
  });

  const submitEntry = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/activity", { method: "POST", body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Activity log saved");
      queryClient.invalidateQueries({ queryKey: ["my-activity"] });
      setForm({ logDate: today, activities: "", blockers: "", tags: [] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));
  };

  const columns = [
    { key: "logDate", header: "Date", render: (r: Record<string, unknown>) => new Date(r.logDate as string).toLocaleDateString() },
    { key: "activities", header: "Activities", render: (r: Record<string, unknown>) => <span className="line-clamp-2 text-sm">{String(r.activities)}</span> },
    { key: "tags", header: "Tags", render: (r: Record<string, unknown>) => (
      <div className="flex flex-wrap gap-1">
        {(r.tags as string[]).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Activity Log</h1>

      <Card>
        <CardHeader><CardTitle>Today&apos;s Entry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Activities</Label>
            <Textarea value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} placeholder="What did you work on today?" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Blockers (optional)</Label>
            <Textarea value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} placeholder="Any blockers or issues?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TAGS.map((tag) => (
                <Badge key={tag} variant={form.tags.includes(tag) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={() => submitEntry.mutate()} disabled={submitEntry.isPending || !form.activities}>
            {submitEntry.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No activity logs yet" />
    </div>
  );
}
