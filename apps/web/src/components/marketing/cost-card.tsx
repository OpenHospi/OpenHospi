import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CostItem {
  name: string;
  description: string;
  cost?: string;
  current?: string;
  atScale?: string;
}

interface CostCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  items: CostItem[];
}

export function CostCard({ icon: Icon, name, description, items }: CostCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base">{name}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.name} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="shrink-0 text-right">
                {item.cost ? (
                  <span className="text-sm font-medium text-primary">{item.cost}</span>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-primary">{item.current}</p>
                    <p className="text-xs text-muted-foreground">{item.atScale}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
