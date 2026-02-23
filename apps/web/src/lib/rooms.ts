import { pool } from "./db";

export type RoomPhoto = {
  id: string;
  slot: number;
  url: string;
  caption: string | null;
};

export type Room = {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
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
  is_verenigingshuis: boolean;
  room_vereniging: string | null;
  preferred_gender: string;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  preferred_lifestyle_tags: string[];
  status: string;
  share_link: string;
  share_link_expires_at: string | null;
  share_link_max_uses: number | null;
  share_link_use_count: number;
  created_at: string;
  updated_at: string;
  photos: RoomPhoto[];
};

export type RoomSummary = {
  id: string;
  title: string;
  city: string;
  rent_price: number;
  status: string;
  cover_photo_url: string | null;
  applicant_count: number;
  created_at: string;
};

export async function createDraftRoom(userId: string): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO rooms (created_by, title, city, rent_price, status)
       VALUES ($1, '', 'amsterdam', 0, 'draft')
       RETURNING id`,
      [userId],
    );
    const roomId = rows[0].id;

    await client.query(
      `INSERT INTO housemates (room_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [roomId, userId],
    );

    await client.query("COMMIT");
    return roomId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getRoom(roomId: string, userId: string): Promise<Room | null> {
  const { rows } = await pool.query(
    `SELECT r.*
     FROM rooms r
     WHERE r.id = $1 AND r.created_by = $2`,
    [roomId, userId],
  );

  if (rows.length === 0) return null;

  const room = rows[0];
  const photos = await getRoomPhotos(roomId);

  return {
    ...room,
    rent_price: Number(room.rent_price),
    deposit: room.deposit ? Number(room.deposit) : null,
    available_from: room.available_from ? room.available_from.toISOString().split("T")[0] : null,
    available_until: room.available_until ? room.available_until.toISOString().split("T")[0] : null,
    share_link_expires_at: room.share_link_expires_at
      ? room.share_link_expires_at.toISOString()
      : null,
    created_at: room.created_at.toISOString(),
    updated_at: room.updated_at.toISOString(),
    features: room.features ?? [],
    location_tags: room.location_tags ?? [],
    preferred_lifestyle_tags: room.preferred_lifestyle_tags ?? [],
    photos,
  };
}

export async function getUserRooms(userId: string): Promise<RoomSummary[]> {
  const { rows } = await pool.query(
    `SELECT
       r.id, r.title, r.city, r.rent_price, r.status, r.created_at,
       (SELECT url FROM room_photos WHERE room_id = r.id AND slot = 1 LIMIT 1) AS cover_photo_url,
       (SELECT COUNT(*) FROM applications WHERE room_id = r.id)::int AS applicant_count
     FROM rooms r
     WHERE r.created_by = $1
     ORDER BY r.created_at DESC`,
    [userId],
  );

  return rows.map((r) => ({
    ...r,
    rent_price: Number(r.rent_price),
    created_at: r.created_at.toISOString(),
  }));
}

export async function getRoomPhotos(roomId: string): Promise<RoomPhoto[]> {
  const { rows } = await pool.query(
    `SELECT id, slot, url, caption FROM room_photos
     WHERE room_id = $1 ORDER BY slot`,
    [roomId],
  );
  return rows;
}
