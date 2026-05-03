import { useRef, useState } from "react";
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
import { Upload, Info } from "lucide-react";

function getCurrentTimeHHmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function TimelogPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const today = formatDateISO(new Date());
  const [form, setForm] = useState({ logDate: today, loginTime: "", logoutTime: "", breakMinutes: "0", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-timelog"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/timelog?limit=30");
      return res.json();
    },
  });

  const isToday = form.logDate === today;
  const currentTime = getCurrentTimeHHmm();

  const submitEntry = useMutation({
    mutationFn: async () => {
      if (isToday && form.loginTime && form.loginTime > currentTime) {
        throw new Error("Login time cannot be in the future. Contact your manager for pre-approval.");
      }
      if (isToday && form.logoutTime && form.logoutTime > currentTime) {
        throw new Error("Logout time cannot be in the future. Contact your manager for pre-approval.");
      }
      const res = await authFetch("/api/v1/timelog", {
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

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return {
        date: obj["date"] ?? obj["log_date"] ?? "",
        loginTime: obj["login_time"] ?? obj["logintime"] ?? obj["login"] ?? "",
        logoutTime: obj["logout_time"] ?? obj["logouttime"] ?? obj["logout"] ?? "",
        breakMinutes: obj["break_minutes"] ?? obj["breakminutes"] ?? obj["break"] ?? "0",
        notes: obj["notes"] ?? "",
      };
    }).filter((r) => r.date && r.loginTime);

    setImporting(true);
    try {
      const res = await authFetch("/api/v1/timelog/import", {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (json.success) {
        const errors = json.data.results.filter((r: { status: string }) => r.status === "error");
        toast.success(`Imported ${json.data.imported}/${json.data.total} entries${errors.length > 0 ? ` (${errors.length} skipped)` : ""}`);
        queryClient.invalidateQueries({ queryKey: ["my-timelog"] });
      } else {
        toast.error(json.error ?? "Import failed");
      }
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Time Log</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVImport(f); }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing…" : "Import CSV"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-4">
        CSV format: <code>date,login_time,logout_time,break_minutes,notes</code>
      </p>

      <Card>
        <CardHeader><CardTitle>Log Entry</CardTitle></CardHeader>
        <CardContent>
          {isToday && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                You can only log time up to the current time (<strong>{currentTime}</strong>).
                To log future hours, contact your manager or admin for approval.
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.logDate}
                onChange={(e) => setForm({ ...form, logDate: e.target.value, loginTime: "", logoutTime: "" })}
                max={today}
              />
            </div>
            <div className="space-y-2">
              <Label>Login Time</Label>
              <Input
                type="time"
                value={form.loginTime}
                onChange={(e) => setForm({ ...form, loginTime: e.target.value })}
                max={isToday ? currentTime : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>Logout Time</Label>
              <Input
                type="time"
                value={form.logoutTime}
                onChange={(e) => setForm({ ...form, logoutTime: e.target.value })}
                max={isToday ? currentTime : undefined}
              />
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
