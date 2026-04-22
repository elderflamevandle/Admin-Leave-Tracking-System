"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CSVExportButtonProps {
  type: "leave" | "timelog" | "activity" | "audit";
  label?: string;
}

export function CSVExportButton({ type, label = "Export CSV" }: CSVExportButtonProps) {
  const { authFetch } = useAuth();

  const handleExport = async () => {
    try {
      const res = await authFetch(`/api/export/${type}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
