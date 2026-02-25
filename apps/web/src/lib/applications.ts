import type { ApplicationStatus } from "@openhospi/shared/enums";

import { pool } from "./db";

export type UserApplication = {
  id: string;
  room_id: string;
  room_title: string;
  room_city: string;
  room_rent_price: number;
  room_cover_photo_url: string | null;
  personal_message: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
};

export type ApplicationDetail = UserApplication & {
  room_description: string | null;
  room_house_type: string | null;
  room_furnishing: string | null;
  room_size_m2: number | null;
  room_total_housemates: number | null;
  room_available_from: string | null;
  room_features: string[];
  room_location_tags: string[];
};

export type RoomDetailForApply = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  rent_price: number;
  deposit: number | null;
  utilities_included: boolean;
  room_size_m2: number | null;
  available_from: string | null;
  available_until: string | null;
  rental_type: string;
  house_type: string | null;
  furnishing: string | null;
  total_housemates: number | null;
  features: string[];
  location_tags: string[];
  room_vereniging: string | null;
  preferred_gender: string;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  preferred_lifestyle_tags: string[];
  created_by: string;
  created_at: string;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
};

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
  const { rows } = await pool.query(
    `SELECT
       a.id, a.room_id, a.personal_message, a.status, a.applied_at, a.updated_at,
       r.title AS room_title, r.city AS room_city, r.rent_price AS room_rent_price,
       (SELECT url FROM room_photos WHERE room_id = r.id AND slot = 1 LIMIT 1) AS room_cover_photo_url
     FROM applications a
     JOIN rooms r ON r.id = a.room_id
     WHERE a.user_id = $1
     ORDER BY a.applied_at DESC`,
    [userId],
  );

  return rows.map((r) => ({
    ...r,
    room_rent_price: Number(r.room_rent_price),
    applied_at: r.applied_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
}

export async function getApplicationDetail(
  applicationId: string,
  userId: string,
): Promise<ApplicationDetail | null> {
  const { rows } = await pool.query(
    `SELECT
       a.id, a.room_id, a.personal_message, a.status, a.applied_at, a.updated_at,
       r.title AS room_title, r.city AS room_city, r.rent_price AS room_rent_price,
       r.description AS room_description, r.house_type AS room_house_type,
       r.furnishing AS room_furnishing, r.room_size_m2 AS room_size_m2,
       r.total_housemates AS room_total_housemates, r.available_from AS room_available_from,
       r.features AS room_features, r.location_tags AS room_location_tags,
       (SELECT url FROM room_photos WHERE room_id = r.id AND slot = 1 LIMIT 1) AS room_cover_photo_url
     FROM applications a
     JOIN rooms r ON r.id = a.room_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [applicationId, userId],
  );

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    ...r,
    room_rent_price: Number(r.room_rent_price),
    room_available_from: r.room_available_from
      ? r.room_available_from.toISOString().split("T")[0]
      : null,
    room_features: r.room_features ?? [],
    room_location_tags: r.room_location_tags ?? [],
    applied_at: r.applied_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  };
}

export async function getApplicationForRoom(
  roomId: string,
  userId: string,
): Promise<{ id: string; status: ApplicationStatus } | null> {
  const { rows } = await pool.query(
    "SELECT id, status FROM applications WHERE room_id = $1 AND user_id = $2",
    [roomId, userId],
  );
  return rows[0] ?? null;
}

export async function getRoomDetailForApply(
  roomId: string,
  userId: string,
): Promise<RoomDetailForApply | null> {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.title, r.description, r.city, r.neighborhood,
       r.rent_price, r.deposit, r.utilities_included,
       r.room_size_m2, r.available_from, r.available_until,
       r.rental_type, r.house_type, r.furnishing, r.total_housemates,
       r.features, r.location_tags, r.room_vereniging,
       r.preferred_gender, r.preferred_age_min, r.preferred_age_max,
       r.preferred_lifestyle_tags, r.created_by, r.created_at
     FROM rooms r
     WHERE r.id = $1 AND r.status = 'active'
       AND (r.room_vereniging IS NULL OR r.room_vereniging = (SELECT vereniging FROM profiles WHERE id = $2))`,
    [roomId, userId],
  );

  if (rows.length === 0) return null;

  const room = rows[0];
  const { rows: photos } = await pool.query(
    "SELECT id, slot, url, caption FROM room_photos WHERE room_id = $1 ORDER BY slot",
    [roomId],
  );

  return {
    ...room,
    rent_price: Number(room.rent_price),
    deposit: room.deposit ? Number(room.deposit) : null,
    available_from: room.available_from ? room.available_from.toISOString().split("T")[0] : null,
    available_until: room.available_until ? room.available_until.toISOString().split("T")[0] : null,
    created_at: room.created_at.toISOString(),
    features: room.features ?? [],
    location_tags: room.location_tags ?? [],
    preferred_lifestyle_tags: room.preferred_lifestyle_tags ?? [],
    photos,
  };
}
