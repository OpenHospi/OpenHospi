import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { Room } from "@/lib/rooms";

type Props = {
  room: Room;
};

export async function RoomDetails({ room }: Props) {
  const t = await getTranslations("app.rooms");
  const tEnums = await getTranslations("enums");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("manage.details")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label={t("fields.city")} value={tEnums(`city.${room.city}` as any)} />
        {room.neighborhood && <Detail label={t("fields.neighborhood")} value={room.neighborhood} />}
        {room.streetName && (
          <Detail
            label={t("fields.address")}
            value={
              [room.streetName, room.houseNumber].filter(Boolean).join(" ") +
              (room.postalCode ? `, ${room.postalCode}` : "")
            }
          />
        )}
        <Detail label={t("fields.rentPrice")} value={`€${room.rentPrice}`} />
        {room.deposit != null && <Detail label={t("fields.deposit")} value={`€${room.deposit}`} />}
        {room.serviceCosts != null && (
          <Detail label={t("fields.serviceCosts")} value={`€${room.serviceCosts}`} />
        )}
        <Detail
          label={t("fields.utilitiesIncluded")}
          value={
            room.utilitiesIncluded ? tEnums(`utilities_included.${room.utilitiesIncluded}` as any) : "—"
          }
        />
        {room.estimatedUtilitiesCosts != null && (
          <Detail
            label={t("fields.estimatedUtilitiesCosts")}
            value={`€${room.estimatedUtilitiesCosts}`}
          />
        )}
        {room.roomSizeM2 && <Detail label={t("fields.roomSize")} value={`${room.roomSizeM2} m²`} />}
        {room.availableFrom && (
          <Detail label={t("fields.availableFrom")} value={room.availableFrom} />
        )}
        {room.availableUntil && (
          <Detail label={t("fields.availableUntil")} value={room.availableUntil} />
        )}
        <Detail label={t("fields.rentalType")} value={tEnums(`rental_type.${room.rentalType}` as any)} />
        {room.houseType && (
          <Detail label={t("fields.houseType")} value={tEnums(`house_type.${room.houseType}` as any)} />
        )}
        {room.furnishing && (
          <Detail label={t("fields.furnishing")} value={tEnums(`furnishing.${room.furnishing}` as any)} />
        )}
        {room.totalHousemates && (
          <Detail label={t("fields.totalHousemates")} value={String(room.totalHousemates)} />
        )}
        {room.roomVereniging && (
          <Detail
            label={t("fields.roomVereniging")}
            value={tEnums(`vereniging.${room.roomVereniging}` as any)}
          />
        )}
        <Detail
          label={t("fields.preferredGender")}
          value={tEnums(`gender_preference.${room.preferredGender}` as any)}
        />
        {room.preferredAgeMin && (
          <Detail label={t("fields.preferredAgeMin")} value={String(room.preferredAgeMin)} />
        )}
        {room.preferredAgeMax && (
          <Detail label={t("fields.preferredAgeMax")} value={String(room.preferredAgeMax)} />
        )}
      </div>

      {room.description && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("fields.description")}</p>
          <p className="mt-1 whitespace-pre-wrap">{room.description}</p>
        </div>
      )}

      {(room.features ?? []).length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("fields.features")}</p>
          <div className="flex flex-wrap gap-1.5">
            {(room.features ?? []).map((f) => (
              <Badge key={f} variant="secondary">
                {tEnums(`room_feature.${f}` as any)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(room.locationTags ?? []).length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("fields.locationTags")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(room.locationTags ?? []).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tEnums(`location_tag.${tag}` as any)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
