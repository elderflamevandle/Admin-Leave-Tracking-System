import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlaceholderPageProps {
  moduleName: string;
  icon: React.ReactNode;
}

export function PlaceholderPage({ moduleName, icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">{moduleName}</h2>
      <p className="mb-6 text-slate-500">
        This module is coming in a future platform update.
      </p>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
