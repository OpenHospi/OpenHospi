import { Home, MapPin, Ruler, Settings, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { getApplicationForRoom, getRoomDetailForApply } from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";

import { ApplyDialog } from "./apply-dialog";

const applicationStatusColors: Record<string, string> = {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const room = await getRoomDetailForApply(id, "");
  if (!room) {
    const t = await getTranslations({ locale, namespace: "app.roomDetail" });
    return { title: t("notFound") };
  }
  return { title: room.title };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function DiscoverRoomDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession(locale);

  const t = await getTranslations({ locale, namespace: "app.roomDetail" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const [room, existingApplication] = await Promise.all([
    getRoomDetailForApply(id, user.id),
    getApplicationForRoom(id, user.id),
  ]);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{t("notAvailable")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/discover">{t("backToDiscover")}</Link>
        </Button>
      </div>
    );
  }

  const isOwner = room.ownerId === user.id;
  const coverPhoto = room.photos[0];
  const otherPhotos = room.photos.slice(1);
  const cityName = tEnums(`city.${room.city}`);

  return (
    <div className="space-y-8">
      {/* Photo gallery */}
      {room.photos.length > 0 && (
        <div className="space-y-2">
          {coverPhoto && (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <Image src={coverPhoto.url} alt={room.title} fill className="object-cover" priority />
            </div>
          )}
          {otherPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {otherPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-video overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? room.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{room.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <span>{cityName}</span>
              {room.neighborhood && <span>· {room.neighborhood}</span>}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold">€{room.rentPrice}</span>
              <span className="text-muted-foreground">{t("perMonth")}</span>
            </div>
            {room.roomSizeM2 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ruler className="size-4" />
                <span>{room.roomSizeM2} m²</span>
              </div>
            )}
            {room.totalHousemates != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                <span>{t("housemates", { count: room.totalHousemates })}</span>
              </div>
            )}
            {room.houseType && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Home className="size-4" />
                <span>{tEnums(`house_type.${room.houseType}`)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {room.description && (
            <div>
              <h2 className="text-lg font-semibold">{t("description")}</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{room.description}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <h2 className="text-lg font-semibold">{t("details")}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {room.furnishing && (
                <>
                  <dt className="text-muted-foreground">{tEnums("furnishing_label")}</dt>
                  <dd>{tEnums(`furnishing.${room.furnishing}`)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">{t("rentalType")}</dt>
              <dd>{tEnums(`rental_type.${room.rentalType}`)}</dd>
              {room.deposit != null && (
                <>
                  <dt className="text-muted-foreground">{t("deposit")}</dt>
                  <dd>€{room.deposit}</dd>
                </>
              )}
              <dt className="text-muted-foreground">
                {room.utilitiesIncluded ? t("utilitiesIncluded") : t("utilitiesExcluded")}
              </dt>
              <dd />
              {room.availableFrom && (
                <>
                  <dt className="text-muted-foreground">
                    {t("availableFrom", { date: room.availableFrom })}
                  </dt>
                  <dd>
                    {room.availableUntil && t("availableUntil", { date: room.availableUntil })}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* Features */}
          {room.features.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">{t("features")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {room.features.map((f) => (
                  <Badge key={f} variant="secondary">
                    {tEnums(`room_feature.${f}`)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location tags */}
          {room.locationTags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">{t("locationTags")}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {room.locationTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tEnums(`location_tag.${tag}`)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preferences */}
          {(room.preferredGender !== "geen_voorkeur" ||
            room.preferredLifestyleTags.length > 0) && (
            <div>
              <h2 className="text-lg font-semibold">{t("preferences")}</h2>
              <div className="mt-2 space-y-2">
                {room.preferredGender !== "geen_voorkeur" && (
                  <p className="text-sm text-muted-foreground">
                    {tEnums(`gender_preference.${room.preferredGender}`)}
                    {room.preferredAgeMin != null &&
                      room.preferredAgeMax != null &&
                      `, ${room.preferredAgeMin}–${room.preferredAgeMax}`}
                  </p>
                )}
                {room.preferredLifestyleTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.preferredLifestyleTags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tEnums(`lifestyle_tag.${tag}`)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                €{room.rentPrice}
                {t("perMonth")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {room.availableFrom && (
                <p className="text-sm text-muted-foreground">
                  {t("availableFrom", { date: room.availableFrom })}
                </p>
              )}

              {isOwner && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/my-rooms/${room.id}`}>
                    <Settings className="size-4" />
                    {t("manageRoom")}
                  </Link>
                </Button>
              )}
              {!isOwner && existingApplication && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={applicationStatusColors[existingApplication.status]}>
                      {tEnums(`application_status.${existingApplication.status}`)}
                    </Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/applications/${existingApplication.id}`}>
                      {t("viewApplication")}
                    </Link>
                  </Button>
                </div>
              )}
              {!isOwner && !existingApplication && <ApplyDialog roomId={room.id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
