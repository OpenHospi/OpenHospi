import { ApplicationStatus, GenderPreference, UtilitiesIncluded } from "@openhospi/shared/enums";
import { Check, Home, Info, MapPin, Ruler, Settings, UserRound, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InstitutionBadge } from "@/components/app/institution-badge";
import { ReportDialog } from "@/components/app/report-dialog";
import { RoomGalleryHero } from "@/components/app/room-gallery-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { Link } from "@/i18n/navigation-app";
import {
  type RoomDetailForApply,
  getApplicationForRoom,
  getRoomDetailForApply,
} from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";
import { getRoomMetadata } from "@/lib/discover";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { getStoragePublicUrl } from "@/lib/storage-url";

import { ApplyDialog } from "./apply-dialog";
import { RoomLocationMapLazy } from "./room-location-map-lazy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "app.roomDetail" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomMetadata(id);
  if (!room) return { title: t("notFound") };

  const cityName = tEnums(`city.${room.city}`);
  const sizeSuffix = room.roomSizeM2 ? ` · ${room.roomSizeM2} m²` : "";
  const title = `${room.title} — ${cityName}`;
  const description = `€${room.totalCost}/mo · ${cityName}${sizeSuffix}`;
  const ogImage = room.coverPhotoPath
    ? getStoragePublicUrl(room.coverPhotoPath, "room-photos")
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function CostBreakdown({
  room,
  t,
}: {
  room: Pick<RoomDetailForApply, "utilitiesIncluded" | "totalCost" | "rentPrice" | "serviceCosts" | "estimatedUtilitiesCosts">;
  t: (key: string) => string;
}) {
  const isIncluded = room.utilitiesIncluded === UtilitiesIncluded.included;
  const isEstimated = room.utilitiesIncluded === UtilitiesIncluded.estimated;
  const hasServiceCosts = room.serviceCosts != null && room.serviceCosts > 0;
  const hasEstimatedUtilities = isEstimated && room.estimatedUtilitiesCosts != null && room.estimatedUtilitiesCosts > 0;
  const hasBreakdown = hasServiceCosts || hasEstimatedUtilities;

  return (
    <>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {isIncluded ? t("rentInclUtilities") : t("rent")}
        </span>
        <span>&euro;{room.rentPrice}</span>
      </div>

      {hasServiceCosts && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("serviceCosts")}</span>
          <span>&euro;{room.serviceCosts}</span>
        </div>
      )}

      {hasEstimatedUtilities && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("utilitiesEstimated")}</span>
          <span>&euro;{room.estimatedUtilitiesCosts}</span>
        </div>
      )}

      {hasBreakdown && (
        <>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>{isEstimated ? t("estimatedTotal") : t("total")}</span>
            <span>&euro;{room.totalCost}</span>
          </div>
        </>
      )}

      {isIncluded && (
        <div className="flex items-center gap-1.5 text-green-600">
          <Check className="size-3.5" />
          <span className="text-xs">{t("utilitiesIncluded")}</span>
        </div>
      )}

      {!isIncluded && !isEstimated && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Info className="size-3.5" />
          <span className="text-xs">{t("utilitiesNotIncluded")}</span>
        </div>
      )}
    </>
  );
}

export default async function DiscoverRoomDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

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
  const isInvitee =
    isOwner ||
    (existingApplication != null &&
      ([ApplicationStatus.invited, ApplicationStatus.attending, ApplicationStatus.accepted] as string[]).includes(
        existingApplication.status,
      ));
  const cityName = tEnums(`city.${room.city}`);

  // Format address — full address only for invitees/owner, street name for all authenticated
  const addressParts = [cityName];
  if (room.neighborhood) addressParts.push(room.neighborhood);
  if (room.streetName) {
    if (isInvitee) {
      const street = [room.streetName, room.houseNumber].filter(Boolean).join(" ");
      addressParts.push(room.postalCode ? `${street}, ${room.postalCode}` : street);
    } else {
      addressParts.push(room.streetName);
    }
  }

  return (
    <div className="space-y-8">
      {/* Photo gallery */}
      {room.photos.length > 0 && (
        <RoomGalleryHero photos={room.photos} roomTitle={room.title} />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{room.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <span>{addressParts.join(" · ")}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold">€{room.totalCost}</span>
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
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <UserRound className="size-4" />
              <span>
                {tEnums(`gender_preference.${room.preferredGender || GenderPreference.no_preference}`)}
                {room.preferredAgeMin != null && room.preferredAgeMax != null &&
                  ` · ${t("ageRange", { min: room.preferredAgeMin, max: room.preferredAgeMax })}`}
              </span>
            </div>
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
              {room.acceptedLanguages.length > 0 && (
                <>
                  <dt className="text-muted-foreground">{t("acceptedLanguages")}</dt>
                  <dd>{room.acceptedLanguages.map((lang) => tEnums(`language_enum.${lang}`)).join(", ")}</dd>
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

          {/* Map */}
          {room.latitude != null && room.longitude != null && (
            <div>
              <h2 className="text-lg font-semibold">{t("location")}</h2>
              <div className="mt-2">
                <RoomLocationMapLazy latitude={room.latitude} longitude={room.longitude} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("approximateLocation")}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          {room.owner && (
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <UserAvatar
                  avatarUrl={room.owner.avatarUrl}
                  userName={`${room.owner.firstName} ${room.owner.lastName}`}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("postedBy")}</p>
                  <p className="truncate font-medium">
                    {room.owner.firstName} {room.owner.lastName}
                  </p>
                  {room.owner.studyProgram && (
                    <p className="truncate text-xs text-muted-foreground">
                      {room.owner.studyProgram}
                      {room.owner.studyLevel &&
                        ` · ${tEnums("study_level." + room.owner.studyLevel)}`}
                    </p>
                  )}
                  <div className="mt-1">
                    <InstitutionBadge domain={room.owner.institutionDomain} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost breakdown card */}
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle>
                <span className="text-2xl">€{room.totalCost}</span>
                <span className="text-base font-normal text-muted-foreground">{t("perMonth")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Cost breakdown */}
              <div className="space-y-1.5 text-sm">
                <CostBreakdown room={room} t={t} />

                {room.deposit != null && (
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">{t("deposit")}</span>
                    <span>€{room.deposit}</span>
                  </div>
                )}
              </div>

              <Separator />

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
                    <Badge className={APPLICATION_STATUS_COLORS[existingApplication.status]}>
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
              {!isOwner && (
                <div className="pt-2">
                  <ReportDialog type="room" targetId={room.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
