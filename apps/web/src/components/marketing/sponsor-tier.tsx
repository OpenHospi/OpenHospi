import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SponsorTierProps {
  name: string;
  price: string;
  description: string;
}

export function SponsorTier({ name, price, description }: SponsorTierProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <p className="text-2xl font-bold text-primary">{price}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
