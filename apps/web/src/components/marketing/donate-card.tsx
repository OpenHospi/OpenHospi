import { Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DonateCardProps {
  name: string;
  price: string;
  badge: string;
  description: string;
}

export function DonateCard({ name, price, badge, description }: DonateCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <Heart className="size-6 text-primary" />
        </div>
        <CardTitle className="mt-4">{name}</CardTitle>
        <p className="text-2xl font-bold text-primary">{price}</p>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary" className="rounded-full">
          {badge}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
