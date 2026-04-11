import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface WaivedCostCardProps {
  logoLight: string;
  logoDark?: string;
  url: string;
  name: string;
  description: string;
  normalCost: string;
  sponsor: string;
  badge: string;
}

export function WaivedCostCard({
  logoLight,
  logoDark,
  url,
  name,
  description,
  normalCost,
  sponsor,
  badge,
}: WaivedCostCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            {logoDark ? (
              <>
                <Image
                  src={logoLight}
                  alt={name}
                  width={120}
                  height={40}
                  className="block h-8 dark:hidden"
                  style={{ width: "auto" }}
                />
                <Image
                  src={logoDark}
                  alt={name}
                  width={120}
                  height={40}
                  className="hidden h-8 dark:block"
                  style={{ width: "auto" }}
                />
              </>
            ) : (
              <Image
                src={logoLight}
                alt={name}
                width={120}
                height={40}
                className="h-8"
                style={{ width: "auto" }}
              />
            )}
          </a>
          <Badge variant="secondary">{badge}</Badge>
        </div>

        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground line-through">{normalCost}</span>
          <span className="text-xs text-muted-foreground">{sponsor}</span>
        </div>
      </CardContent>
    </Card>
  );
}
