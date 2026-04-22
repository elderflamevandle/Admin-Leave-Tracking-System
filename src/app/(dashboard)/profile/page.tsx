"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, authFetch } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName ?? "", department: user?.department ?? "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/users/me", { method: "PATCH", body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error("Passwords do not match");
      const res = await authFetch("/api/users/me", { method: "PATCH", body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => { toast.success("Password changed — please log in again"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="flex items-center gap-3">
            <Label>Role</Label>
            <Badge variant="secondary">{user?.roleName}</Badge>
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
          <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending || !pwForm.currentPassword || !pwForm.newPassword}>
            {changePassword.isPending ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
