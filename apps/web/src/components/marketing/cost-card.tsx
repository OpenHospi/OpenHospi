import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CostCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  cost: string;
}

export function CostCard({ icon: Icon, name, description, cost }: CostCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{name}</h3>
            <span className="text-sm font-medium text-primary">{cost}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
