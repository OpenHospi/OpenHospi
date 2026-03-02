import { GenderPreference, UtilitiesIncluded } from "@openhospi/shared/enums";
import { Check, Home, Info, MapPin, Ruler, UserRound, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { InstitutionBadge } from "@/components/app/institution-badge";
import { RoomGalleryHero } from "@/components/app/room-gallery-hero";
import { RoomLocationMapLazy } from "@/components/app/room-location-map-lazy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import type { RoomDetail, RoomDetailContext } from "@/lib/room-detail";

type Props = {
  room: RoomDetail;
  context: RoomDetailContext;
  sidebarActions?: React.ReactNode;
};

function CostBreakdown({
  room,
  t,
}: {
  room: Pick<
    RoomDetail,
    "utilitiesIncluded" | "totalCost" | "rentPrice" | "serviceCosts" | "estimatedUtilitiesCosts"
  >;
  t: (key: string) => string;
}) {
  const isIncluded = room.utilitiesIncluded === UtilitiesIncluded.included;
  const isEstimated = room.utilitiesIncluded === UtilitiesIncluded.estimated;
  const hasServiceCosts = room.serviceCosts != null && room.serviceCosts > 0;
  const hasEstimatedUtilities =
    isEstimated && room.estimatedUtilitiesCosts != null && room.estimatedUtilitiesCosts > 0;
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

export async function RoomDetailContent({ room, context, sidebarActions }: Props) {
  const t = await getTranslations("app.roomDetail");
  const tCommon = await getTranslations("common.labels");
  const tEnums = await getTranslations("enums");

  const cityName = tEnums(`city.${room.city}` as any);

  // Build address parts based on auth level
  const addressParts = [cityName];
  if (room.neighborhood) addressParts.push(room.neighborhood);
  if (context.isAuthenticated && room.streetName) {
    if (context.isInvitee) {
      const street = [room.streetName, room.houseNumber].filter(Boolean).join(" ");
      addressParts.push(room.postalCode ? `${street}, ${room.postalCode}` : street);
    } else {
      addressParts.push(room.streetName);
    }
  }

  return (
    <div className="space-y-8">
      {/* Photo gallery */}
      {room.photos.length > 0 && <RoomGalleryHero photos={room.photos} roomTitle={room.title} />}

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
              <span className="text-muted-foreground">{tCommon("perMonth")}</span>
            </div>
            {room.roomSizeM2 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ruler className="size-4" />
                <span>{t("roomSize", { size: room.roomSizeM2 })}</span>
              </div>
            )}
            {room.totalHousemates != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                <span>{tCommon("housemates", { count: room.totalHousemates })}</span>
              </div>
            )}
            {room.houseType && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Home className="size-4" />
                <span>{tEnums(`house_type.${room.houseType}` as any)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <UserRound className="size-4" />
              <span>
                {tEnums(
                  `gender_preference.${room.preferredGender || GenderPreference.no_preference}`,
                )}
                {room.preferredAgeMin != null &&
                  room.preferredAgeMax != null &&
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
                  <dd>{tEnums(`furnishing.${room.furnishing}` as any)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">{t("rentalType")}</dt>
              <dd>{tEnums(`rental_type.${room.rentalType}` as any)}</dd>
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
              {context.isAuthenticated && room.acceptedLanguages.length > 0 && (
                <>
                  <dt className="text-muted-foreground">{t("acceptedLanguages")}</dt>
                  <dd>
                    {room.acceptedLanguages
                      .map((lang) => tEnums(`language_enum.${lang}` as any))
                      .join(", ")}
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
                    {tEnums(`room_feature.${f}` as any)}
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
                    {tEnums(`location_tag.${tag}` as any)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Map — authenticated only */}
          {context.isAuthenticated && room.latitude != null && room.longitude != null && (
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
          {/* Owner card — authenticated only */}
          {context.isAuthenticated && room.owner && (
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
                <span className="text-base font-normal text-muted-foreground">
                  {tCommon("perMonth")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

              {/* Auth-specific actions */}
              {sidebarActions}

              {/* Public: login CTA */}
              {!context.isAuthenticated && context.loginUrl && (
                <Button asChild className="w-full">
                  <a href={context.loginUrl}>{t("loginToApply")}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
