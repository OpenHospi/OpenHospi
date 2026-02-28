import {GenderPreference} from "@openhospi/shared/enums";
import {Home, MapPin, Ruler, Settings, Users} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {ReportDialog} from "@/components/app/report-dialog";
import {StorageImage} from "@/components/storage-image";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Link} from "@/i18n/navigation-app";
import {getApplicationForRoom, getRoomDetailForApply} from "@/lib/applications";
import {requireSession} from "@/lib/auth-server";
import {APPLICATION_STATUS_COLORS} from "@/lib/status-colors";
import {ApplyDialog} from "./apply-dialog";

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
    const {locale, id} = await params;
    const room = await getRoomDetailForApply(id, "");
    if (!room) {
        const t = await getTranslations({locale, namespace: "app.roomDetail"});
        return {title: t("notFound")};
    }
    return {title: room.title};
}

type Props = {
    params: Promise<{ locale: string; id: string }>;
};

export default async function DiscoverRoomDetailPage({params}: Props) {
    const {locale, id} = await params;
    setRequestLocale(locale);
    const {user} = await requireSession();

    const t = await getTranslations({locale, namespace: "app.roomDetail"});
    const tEnums = await getTranslations({locale, namespace: "enums"});

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
                            <StorageImage
                                src={coverPhoto.url}
                                alt={room.title}
                                bucket="room-photos"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    {otherPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {otherPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="relative aspect-video overflow-hidden rounded-lg bg-muted"
                                >
                                    <StorageImage
                                        src={photo.url}
                                        alt={photo.caption ?? room.title}
                                        bucket="room-photos"
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
                            <MapPin className="size-4"/>
                            <span>{cityName}</span>
                            {room.neighborhood && <span>· {room.neighborhood}</span>}
                            {room.address && <span>· {room.address}</span>}
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
                                <Ruler className="size-4"/>
                                <span>{room.roomSizeM2} m²</span>
                            </div>
                        )}
                        {room.totalHousemates != null && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="size-4"/>
                                <span>{t("housemates", {count: room.totalHousemates})}</span>
                            </div>
                        )}
                        {room.houseType && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Home className="size-4"/>
                                <span>{tEnums(`house_type.${room.houseType}`)}</span>
                            </div>
                        )}
                    </div>

                    <Separator/>

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
                            {room.utilitiesIncluded && (
                                <>
                                    <dt className="text-muted-foreground">{t("utilitiesIncluded")}</dt>
                                    <dd/>
                                </>
                            )}
                            {!room.utilitiesIncluded && room.serviceCosts != null && (
                                <>
                                    <dt className="text-muted-foreground">{t("rent")}</dt>
                                    <dd>€{room.rentPrice}</dd>
                                    <dt className="text-muted-foreground">{t("serviceCosts")}</dt>
                                    <dd>€{room.serviceCosts}</dd>
                                    <dt className="text-muted-foreground">{t("totalCost")}</dt>
                                    <dd>€{room.totalCost}</dd>
                                </>
                            )}
                            {!room.utilitiesIncluded && room.serviceCosts == null && (
                                <>
                                    <dt className="text-muted-foreground">{t("utilitiesExcluded")}</dt>
                                    <dd/>
                                </>
                            )}
                            {room.availableFrom && (
                                <>
                                    <dt className="text-muted-foreground">
                                        {t("availableFrom", {date: room.availableFrom})}
                                    </dt>
                                    <dd>
                                        {room.availableUntil && t("availableUntil", {date: room.availableUntil})}
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
                    {(room.preferredGender !== GenderPreference.no_preference ||
                        room.preferredLifestyleTags.length > 0) && (
                        <div>
                            <h2 className="text-lg font-semibold">{t("preferences")}</h2>
                            <div className="mt-2 space-y-2">
                                {room.preferredGender !== GenderPreference.no_preference && (
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
                                €{room.totalCost}
                                {t("perMonth")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {room.availableFrom && (
                                <p className="text-sm text-muted-foreground">
                                    {t("availableFrom", {date: room.availableFrom})}
                                </p>
                            )}

                            {isOwner && (
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/my-rooms/${room.id}`}>
                                        <Settings className="size-4"/>
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
                            {!isOwner && !existingApplication && <ApplyDialog roomId={room.id}/>}
                            {!isOwner && (
                                <div className="pt-2">
                                    <ReportDialog type="room" targetId={room.id}/>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
