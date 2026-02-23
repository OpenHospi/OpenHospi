import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DonateCardProps {
  title: string;
  description: string;
  oneTimeLabel: string;
  monthlyLabel: string;
  ctaLabel: string;
}

export function DonateCard({
  title,
  description,
  oneTimeLabel,
  monthlyLabel,
  ctaLabel,
}: DonateCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <Heart className="size-6 text-primary" />
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {oneTimeLabel}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {monthlyLabel}
          </span>
        </div>
        <div className="mt-6">
          <Button asChild variant="outline" className="w-full">
            <a
              href="https://opencollective.com/openhospi"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ctaLabel}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
