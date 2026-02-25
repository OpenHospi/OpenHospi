import { Home } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { UserApplication } from "@/lib/applications";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  seen: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  liked: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  maybe: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  invited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  not_chosen: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-muted text-muted-foreground",
};

type Props = {
  application: UserApplication;
};

export async function ApplicationCard({ application }: Props) {
  const t = await getTranslations("app.applications");
  const tEnums = await getTranslations("enums");

  const appliedDate = new Date(application.applied_at).toLocaleDateString();

  return (
    <Link href={`/applications/${application.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {application.room_cover_photo_url ? (
            <Image
              src={application.room_cover_photo_url}
              alt={application.room_title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
          <Badge className={cn("absolute top-2 right-2", statusColors[application.status])}>
            {tEnums(`application_status.${application.status}`)}
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <h3 className="truncate font-semibold">{application.room_title}</h3>
          <p className="text-sm text-muted-foreground">{tEnums(`city.${application.room_city}`)}</p>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            €{application.room_rent_price}
            <span className="font-normal text-muted-foreground">/mo</span>
          </span>
          <span className="text-muted-foreground">{t("appliedOn", { date: appliedDate })}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
