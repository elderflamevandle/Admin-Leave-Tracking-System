"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [showForceLogout, setShowForceLogout] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await authFetch(`/api/users/${id}`);
      return res.json();
    },
  });

  const sendReset = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  const forceLogout = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/admin/users/${id}/force-logout`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("User force logged out"); setShowForceLogout(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-6 text-slate-400">Loading...</div>;
  const user = data?.data;
  if (!user) return <div className="p-6">User not found.</div>;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? "Active" : "Inactive"}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>User Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{user.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Role</span><Badge variant="secondary">{user.role?.displayName}</Badge></div>
          <div className="flex justify-between"><span className="text-slate-500">Department</span><span>{user.department ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Leave Balance</span><span>{user.leaveBalance} days</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Last Login</span><span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => sendReset.mutate()} disabled={sendReset.isPending}>
            {sendReset.isPending ? "Sending..." : "Send Password Reset"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowForceLogout(true)}>Force Logout</Button>
        </CardContent>
      </Card>

      <ConfirmModal
        open={showForceLogout}
        onClose={() => setShowForceLogout(false)}
        onConfirm={() => forceLogout.mutate()}
        title="Force Logout"
        description="This will immediately invalidate all active sessions for this user."
        confirmLabel="Force Logout"
        destructive
        isLoading={forceLogout.isPending}
      />
    </div>
  );
}
