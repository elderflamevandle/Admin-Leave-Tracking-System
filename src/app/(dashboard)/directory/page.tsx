"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePagination } from "@/hooks/use-pagination";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search } from "lucide-react";

export default function DirectoryPage() {
  const { authFetch } = useAuth();
  const [search, setSearch] = useState("");
  const { page, setPage } = usePagination();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25", ...(search && { search }) });
      const res = await authFetch(`/api/users?${params}`);
      return res.json();
    },
  });

  const columns = [
    { key: "fullName", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row: Record<string, unknown>) => {
        const role = row.role as { displayName: string };
        return <Badge variant="secondary">{role?.displayName}</Badge>;
      },
    },
    { key: "department", header: "Department" },
    {
      key: "isActive",
      header: "Status",
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row: Record<string, unknown>) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/directory/${row.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-8"
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={data?.meta?.totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No employees found"
      />
    </div>
  );
}
