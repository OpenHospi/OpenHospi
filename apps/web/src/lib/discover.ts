import { ROOMS_PER_PAGE } from "@openhospi/shared/constants";

import { pool } from "./db";

export type DiscoverRoom = {
  id: string;
  title: string;
  city: string;
  rent_price: number;
  house_type: string | null;
  furnishing: string | null;
  room_size_m2: number | null;
  available_from: string | null;
  total_housemates: number | null;
  features: string[];
  location_tags: string[];
  cover_photo_url: string | null;
  created_at: string;
};

export type DiscoverFilters = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  houseType?: string;
  furnishing?: string;
  availableFrom?: string;
  features?: string[];
  locationTags?: string[];
};

export type DiscoverSort = "newest" | "cheapest" | "most_expensive";

export type DiscoverResult = {
  rooms: DiscoverRoom[];
  total: number;
};

export type PublicRoom = {
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
  preferred_gender: string;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  preferred_lifestyle_tags: string[];
  created_at: string;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
};

export type CityWithCount = {
  city: string;
  count: number;
};

const ORDER_MAP: Record<DiscoverSort, string> = {
  newest: "r.created_at DESC",
  cheapest: "r.rent_price ASC",
  most_expensive: "r.rent_price DESC",
};

export async function getDiscoverRooms(
  userId: string,
  filters: DiscoverFilters,
  page: number,
  sort: DiscoverSort,
): Promise<DiscoverResult> {
  const conditions: string[] = ["r.status = 'active'"];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Vereiniging visibility: show non-vereniging rooms + rooms matching user's vereniging
  conditions.push(
    `(r.room_vereniging IS NULL OR r.room_vereniging = (SELECT vereniging FROM profiles WHERE id = $${paramIndex}))`,
  );
  params.push(userId);
  paramIndex++;

  if (filters.city) {
    conditions.push(`r.city = $${paramIndex}`);
    params.push(filters.city);
    paramIndex++;
  }

  if (filters.minPrice != null) {
    conditions.push(`r.rent_price >= $${paramIndex}`);
    params.push(filters.minPrice);
    paramIndex++;
  }

  if (filters.maxPrice != null) {
    conditions.push(`r.rent_price <= $${paramIndex}`);
    params.push(filters.maxPrice);
    paramIndex++;
  }

  if (filters.houseType) {
    conditions.push(`r.house_type = $${paramIndex}`);
    params.push(filters.houseType);
    paramIndex++;
  }

  if (filters.furnishing) {
    conditions.push(`r.furnishing = $${paramIndex}`);
    params.push(filters.furnishing);
    paramIndex++;
  }

  if (filters.availableFrom) {
    conditions.push(`r.available_from <= $${paramIndex}`);
    params.push(filters.availableFrom);
    paramIndex++;
  }

  if (filters.features && filters.features.length > 0) {
    conditions.push(`r.features @> $${paramIndex}`);
    params.push(filters.features);
    paramIndex++;
  }

  if (filters.locationTags && filters.locationTags.length > 0) {
    conditions.push(`r.location_tags @> $${paramIndex}`);
    params.push(filters.locationTags);
    paramIndex++;
  }

  const where = conditions.join(" AND ");
  const orderBy = ORDER_MAP[sort] || ORDER_MAP.newest;
  const offset = (page - 1) * ROOMS_PER_PAGE;

  const countQuery = `SELECT COUNT(*)::int AS total FROM rooms r WHERE ${where}`;
  const dataQuery = `
    SELECT
      r.id, r.title, r.city, r.rent_price, r.house_type, r.furnishing,
      r.room_size_m2, r.available_from, r.total_housemates,
      r.features, r.location_tags, r.created_at,
      (SELECT url FROM room_photos WHERE room_id = r.id AND slot = 1 LIMIT 1) AS cover_photo_url
    FROM rooms r
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, params),
    pool.query(dataQuery, [...params, ROOMS_PER_PAGE, offset]),
  ]);

  return {
    total: countResult.rows[0].total,
    rooms: dataResult.rows.map((r) => ({
      ...r,
      rent_price: Number(r.rent_price),
      available_from: r.available_from ? r.available_from.toISOString().split("T")[0] : null,
      created_at: r.created_at.toISOString(),
      features: r.features ?? [],
      location_tags: r.location_tags ?? [],
    })),
  };
}

export async function getPublicRoom(roomId: string): Promise<PublicRoom | null> {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.title, r.description, r.city, r.neighborhood,
       r.rent_price, r.deposit, r.utilities_included,
       r.room_size_m2, r.available_from, r.available_until,
       r.rental_type, r.house_type, r.furnishing, r.total_housemates,
       r.features, r.location_tags,
       r.preferred_gender, r.preferred_age_min, r.preferred_age_max,
       r.preferred_lifestyle_tags, r.created_at
     FROM rooms r
     WHERE r.id = $1 AND r.status = 'active' AND r.room_vereniging IS NULL`,
    [roomId],
  );

  if (rows.length === 0) return null;

  const room = rows[0];
  const { rows: photos } = await pool.query(
    `SELECT id, slot, url, caption FROM room_photos WHERE room_id = $1 ORDER BY slot`,
    [roomId],
  );

  return {
    ...room,
    rent_price: Number(room.rent_price),
    deposit: room.deposit ? Number(room.deposit) : null,
    available_from: room.available_from ? room.available_from.toISOString().split("T")[0] : null,
    available_until: room.available_until
      ? room.available_until.toISOString().split("T")[0]
      : null,
    created_at: room.created_at.toISOString(),
    features: room.features ?? [],
    location_tags: room.location_tags ?? [],
    preferred_lifestyle_tags: room.preferred_lifestyle_tags ?? [],
    photos,
  };
}

export async function getPublicRoomsByCity(
  city: string,
  limit: number,
): Promise<DiscoverRoom[]> {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.title, r.city, r.rent_price, r.house_type, r.furnishing,
       r.room_size_m2, r.available_from, r.total_housemates,
       r.features, r.location_tags, r.created_at,
       (SELECT url FROM room_photos WHERE room_id = r.id AND slot = 1 LIMIT 1) AS cover_photo_url
     FROM rooms r
     WHERE r.status = 'active' AND r.room_vereniging IS NULL AND r.city = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [city, limit],
  );

  return rows.map((r) => ({
    ...r,
    rent_price: Number(r.rent_price),
    available_from: r.available_from ? r.available_from.toISOString().split("T")[0] : null,
    created_at: r.created_at.toISOString(),
    features: r.features ?? [],
    location_tags: r.location_tags ?? [],
  }));
}

export async function getCitiesWithRoomCount(): Promise<CityWithCount[]> {
  const { rows } = await pool.query(
    `SELECT city, COUNT(*)::int AS count
     FROM rooms
     WHERE status = 'active' AND room_vereniging IS NULL
     GROUP BY city
     ORDER BY count DESC, city ASC`,
  );

  return rows;
}
