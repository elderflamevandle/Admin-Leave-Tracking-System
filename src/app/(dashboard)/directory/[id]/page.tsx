"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { authFetch } = useAuth();
  const { isAdmin } = useRole();

  const { data, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await authFetch(`/api/users/${id}`);
      return res.json();
    },
  });

  if (isLoading) return <div className="p-6 text-slate-400">Loading...</div>;
  if (!data?.data) return <div className="p-6 text-slate-500">Employee not found.</div>;

  const user = data.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/directory"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{user.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Department</span><span>{user.department ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Role</span><Badge variant="secondary">{user.role?.displayName}</Badge></div>
            <div className="flex justify-between"><span className="text-slate-500">Join Date</span><span>{new Date(user.joinDate).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leave Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Leave Balance</span><span className="font-semibold">{user.leaveBalance} days</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Last Login</span><span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</span></div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${id}`}>Edit User</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
