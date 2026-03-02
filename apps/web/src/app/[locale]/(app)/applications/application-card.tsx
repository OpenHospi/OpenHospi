import { Camera, Home } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { StorageImage } from "@/components/storage-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import type { UserApplication } from "@/lib/applications";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

type Props = {
  application: UserApplication;
};

export async function ApplicationCard({ application }: Props) {
  const t = await getTranslations("app.applications");
  const tEnums = await getTranslations("enums");
  const format = await getFormatter();

  const appliedDate = format.dateTime(new Date(application.appliedAt), "short");

  return (
    <Link href={`/applications/${application.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {application.roomCoverPhotoUrl ? (
            <StorageImage
              src={application.roomCoverPhotoUrl}
              alt={application.roomTitle}
              bucket="room-photos"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
          <Badge
            className={cn("absolute top-2 right-2", APPLICATION_STATUS_COLORS[application.status])}
          >
            {tEnums(`application_status.${application.status}`)}
          </Badge>
          {application.roomPhotoCount > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              <Camera className="size-3" />
              {application.roomPhotoCount}
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="truncate font-semibold">{application.roomTitle}</h3>
          <p className="text-sm text-muted-foreground">{tEnums(`city.${application.roomCity}`)}</p>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            €{application.roomRentPrice}
            <span className="font-normal text-muted-foreground">/mo</span>
          </span>
          <span className="text-muted-foreground">{t("appliedOn", { date: appliedDate })}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
