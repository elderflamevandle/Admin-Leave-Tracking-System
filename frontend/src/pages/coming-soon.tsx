import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

interface ComingSoonProps {
  module: string;
}

export default function PlaceholderComingSoon({ module }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-6">
        <Lock className="h-10 w-10 text-slate-400" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">{module}</h2>
      <p className="mb-6 text-slate-500">
        This module is coming in a future platform update.
      </p>
      <Button variant="outline" asChild>
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
