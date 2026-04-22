"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewUserPage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", roleId: "", department: "", joinDate: "", sendWelcome: true });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const res = await authFetch("/api/admin/roles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { id: string; name: string; displayName: string }[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      router.push("/admin/users");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold">Create User</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>User Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v })}>
              <SelectTrigger>
                <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
              </SelectTrigger>
              <SelectContent>
                {rolesData?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department (optional)</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Join Date</Label>
            <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.sendWelcome} onCheckedChange={(v) => setForm({ ...form, sendWelcome: v === true })} id="sendWelcome" />
            <Label htmlFor="sendWelcome" className="font-normal">Send welcome email with temporary password</Label>
          </div>
          <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending || !form.fullName || !form.email || !form.roleId}>
            {create.isPending ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
