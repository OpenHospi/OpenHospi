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
        <Detail label={t("fields.city")} value={tEnums(`city.${room.city}`)} />
        {room.neighborhood && <Detail label={t("fields.neighborhood")} value={room.neighborhood} />}
        {room.address && <Detail label={t("fields.address")} value={room.address} />}
        <Detail label={t("fields.rentPrice")} value={`€${room.rent_price}`} />
        {room.deposit != null && <Detail label={t("fields.deposit")} value={`€${room.deposit}`} />}
        <Detail label={t("fields.utilitiesIncluded")} value={room.utilities_included ? "✓" : "✗"} />
        {room.room_size_m2 && (
          <Detail label={t("fields.roomSize")} value={`${room.room_size_m2} m²`} />
        )}
        {room.available_from && (
          <Detail label={t("fields.availableFrom")} value={room.available_from} />
        )}
        {room.available_until && (
          <Detail label={t("fields.availableUntil")} value={room.available_until} />
        )}
        <Detail label={t("fields.rentalType")} value={tEnums(`rental_type.${room.rental_type}`)} />
        {room.house_type && (
          <Detail label={t("fields.houseType")} value={tEnums(`house_type.${room.house_type}`)} />
        )}
        {room.furnishing && (
          <Detail label={t("fields.furnishing")} value={tEnums(`furnishing.${room.furnishing}`)} />
        )}
        {room.total_housemates && (
          <Detail label={t("fields.totalHousemates")} value={String(room.total_housemates)} />
        )}
        <Detail
          label={t("fields.preferredGender")}
          value={tEnums(`gender_preference.${room.preferred_gender}`)}
        />
        {room.preferred_age_min && (
          <Detail label={t("fields.preferredAgeMin")} value={String(room.preferred_age_min)} />
        )}
        {room.preferred_age_max && (
          <Detail label={t("fields.preferredAgeMax")} value={String(room.preferred_age_max)} />
        )}
      </div>

      {room.description && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("fields.description")}</p>
          <p className="mt-1 whitespace-pre-wrap">{room.description}</p>
        </div>
      )}

      {room.features.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("fields.features")}</p>
          <div className="flex flex-wrap gap-1.5">
            {room.features.map((f) => (
              <Badge key={f} variant="secondary">
                {tEnums(`room_feature.${f}`)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {room.location_tags.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("fields.locationTags")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {room.location_tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tEnums(`location_tag.${tag}`)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {room.preferred_lifestyle_tags.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {t("fields.preferredLifestyleTags")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {room.preferred_lifestyle_tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tEnums(`lifestyle_tag.${tag}`)}
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
