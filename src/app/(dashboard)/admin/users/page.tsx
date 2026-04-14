"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", ...(search && { search }) });
      const res = await authFetch(`/api/users?${params}`);
      return res.json();
    },
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("User deactivated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setDeactivateId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = [
    { key: "fullName", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (r: Record<string, unknown>) => <Badge variant="secondary">{(r.role as { displayName: string })?.displayName}</Badge> },
    { key: "department", header: "Department", render: (r: Record<string, unknown>) => String(r.department ?? "—") },
    { key: "isActive", header: "Status", render: (r: Record<string, unknown>) => <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
    { key: "lastLoginAt", header: "Last Login", render: (r: Record<string, unknown>) => r.lastLoginAt ? new Date(r.lastLoginAt as string).toLocaleDateString() : "Never" },
    { key: "actions", header: "", render: (r: Record<string, unknown>) => (
      <div className="flex gap-1">
        <Button size="sm" variant="outline" asChild><Link href={`/admin/users/${r.id}`}>Edit</Link></Button>
        {r.isActive && <Button size="sm" variant="ghost" onClick={() => setDeactivateId(r.id as string)}>Deactivate</Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <Button asChild><Link href="/admin/users/new"><UserPlus className="mr-2 h-4 w-4" /> Create User</Link></Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No users found" />
      <ConfirmModal
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() => deactivateId && deactivate.mutate(deactivateId)}
        title="Deactivate User"
        description="This user will no longer be able to log in. This action can be reversed."
        confirmLabel="Deactivate"
        destructive
        isLoading={deactivate.isPending}
      />
    </div>
  );
}
