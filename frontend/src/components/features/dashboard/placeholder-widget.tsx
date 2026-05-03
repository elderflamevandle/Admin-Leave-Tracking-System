import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PlaceholderWidgetProps {
  title: string;
}

export function PlaceholderWidget({ title }: PlaceholderWidgetProps) {
  return (
    <Card className="opacity-60">
      <CardContent className="flex items-center gap-3 p-4">
        <Lock className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-medium text-slate-600">{title}</p>
          <p className="text-xs text-slate-400">Available in a future update</p>
        </div>
      </CardContent>
    </Card>
  );
}
