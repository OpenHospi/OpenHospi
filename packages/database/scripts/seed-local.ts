import { createClient } from "@supabase/supabase-js";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { reset, seed } from "drizzle-seed";

import * as schema from "../src/schema/index.js";

// Safety guard
if (process.env.NODE_ENV === "production") {
  throw new Error("Seed script must not run in production.");
}

const LOCAL_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const client = postgres(LOCAL_DB_URL);
const db = drizzle({ client, schema });

// 1. Reset all tables (TRUNCATE ... CASCADE)
await reset(db, schema);

// 2. Seed all tables with deterministic data
await seed(db, schema, { seed: 42 }).refine((f) => ({
  // --- Auth tables ---
  user: {
    count: 10,
    columns: {
      name: f.fullName(),
      email: f.email(),
      emailVerified: f.default({ defaultValue: true }),
      role: f.valuesFromArray({
        values: [
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "admin",
        ],
      }),
    },
    with: {
      account: 1,
      profiles: 1,
      session: [
        { weight: 0.7, count: 1 },
        { weight: 0.3, count: 2 },
      ],
    },
  },
  account: {
    columns: {
      providerId: f.valuesFromArray({ values: ["surfconext"] }),
      scope: f.default({ defaultValue: "openid profile email" }),
    },
  },

  // --- Profiles ---
  profiles: {
    columns: {
      firstName: f.firstName(),
      lastName: f.lastName(),
      email: f.email(),
      institutionDomain: f.valuesFromArray({
        values: [
          "uva.nl",
          "vu.nl",
          "rug.nl",
          "tue.nl",
          "leidenuniv.nl",
          "uu.nl",
          "ru.nl",
          "tudelft.nl",
          "wur.nl",
          "um.nl",
        ],
      }),
      affiliation: f.default({ defaultValue: "student" }),
      bio: f.loremIpsum(),
      studyProgram: f.valuesFromArray({
        values: [
          "Informatica",
          "Rechten",
          "Geneeskunde",
          "Psychologie",
          "Econometrie",
          "Werktuigbouwkunde",
          "Biologie",
          "Geschiedenis",
          "Scheikunde",
          "Filosofie",
        ],
      }),
      studyLevel: f.valuesFromArray({
        values: [
          "wo_bachelor",
          "hbo_bachelor",
          "master",
          "pre_master",
          "wo_propedeuse",
        ],
      }),
      role: f.valuesFromArray({
        values: [
          "seeker",
          "hospi",
          "hospi",
          "seeker",
          "seeker",
          "hospi",
          "seeker",
          "seeker",
          "hospi",
          "admin",
        ],
      }),
      maxRent: f.number({ minValue: 300, maxValue: 800, precision: 100 }),
      preferredCity: f.valuesFromArray({
        values: [
          "amsterdam",
          "utrecht",
          "groningen",
          "eindhoven",
          "rotterdam",
          "leiden",
          "nijmegen",
          "delft",
          "maastricht",
          "enschede",
        ],
      }),
      gender: f.valuesFromArray({
        values: ["male", "female", "prefer_not_to_say"],
      }),
      lifestyleTags: f.default({ defaultValue: [] }),
      languages: f.default({ defaultValue: [] }),
      preferredLocale: f.valuesFromArray({ values: ["nl", "en", "nl"] }),
    },
    with: {
      publicKeys: 1,
      privateKeyBackups: 1,
      notifications: 1,
      pushTokens: 1,
    },
  },

  // --- Houses ---
  houses: {
    count: 5,
    columns: {
      name: f.valuesFromArray({
        values: [
          "Casa de Vries",
          "Studentenhuis Bakker",
          "Huize Zonneveld",
          "Het Groene Huis",
          "Villa Academica",
        ],
      }),
    },
    with: {
      houseMembers: [
        { weight: 0.4, count: 1 },
        { weight: 0.4, count: 2 },
        { weight: 0.2, count: 3 },
      ],
    },
  },
  houseMembers: {
    columns: {
      role: f.valuesFromArray({ values: ["owner", "member", "member"] }),
    },
  },

  // --- Rooms ---
  rooms: {
    count: 8,
    columns: {
      title: f.valuesFromArray({
        values: [
          "Ruime kamer in centrum",
          "Gezellige studio bij station",
          "Lichte hoeksuite",
          "Kamer met balkon",
          "Studentenkamer op toplocatie",
          "Rustige kamer in woongroep",
          "Gemeubileerde kamer",
          "Kamer met eigen badkamer",
        ],
      }),
      description: f.loremIpsum({ sentencesCount: 3 }),
      city: f.valuesFromArray({
        values: [
          "amsterdam",
          "utrecht",
          "groningen",
          "eindhoven",
          "rotterdam",
          "leiden",
          "nijmegen",
          "delft",
        ],
      }),
      neighborhood: f.valuesFromArray({
        values: [
          "Centrum",
          "Oost",
          "West",
          "Noord",
          "Zuid",
          "Binnenstad",
          "Paddepoel",
          "Woensel",
        ],
      }),
      rentPrice: f.number({ minValue: 300, maxValue: 750, precision: 100 }),
      deposit: f.number({ minValue: 300, maxValue: 750, precision: 100 }),
      serviceCosts: f.number({ minValue: 30, maxValue: 100, precision: 100 }),
      roomSizeM2: f.int({ minValue: 10, maxValue: 30 }),
      rentalType: f.valuesFromArray({
        values: ["permanent", "temporary", "sublet"],
      }),
      houseType: f.valuesFromArray({
        values: ["student_house", "apartment", "studio", "living_group"],
      }),
      furnishing: f.valuesFromArray({
        values: ["unfurnished", "semi_furnished", "furnished"],
      }),
      totalHousemates: f.int({ minValue: 2, maxValue: 8 }),
      status: f.valuesFromArray({
        values: [
          "active",
          "active",
          "active",
          "draft",
          "paused",
          "closed",
          "active",
          "active",
        ],
      }),
      preferredGender: f.valuesFromArray({
        values: ["no_preference", "male", "female", "no_preference"],
      }),
      features: f.default({ defaultValue: [] }),
      locationTags: f.default({ defaultValue: [] }),
      preferredLifestyleTags: f.default({ defaultValue: [] }),
      acceptedLanguages: f.default({ defaultValue: [] }),
    },
    with: {
      applications: [
        { weight: 0.6, count: [1, 2, 3] },
        { weight: 0.4, count: [4, 5] },
      ],
      hospiEvents: [
        { weight: 0.6, count: 1 },
        { weight: 0.4, count: 2 },
      ],
      conversations: [
        { weight: 0.6, count: [1, 2] },
        { weight: 0.4, count: 3 },
      ],
    },
  },

  // --- Applications ---
  applications: {
    columns: {
      personalMessage: f.loremIpsum({ sentencesCount: 2 }),
      status: f.valuesFromArray({
        values: [
          "sent",
          "seen",
          "liked",
          "maybe",
          "rejected",
          "invited",
          "attending",
          "not_attending",
          "accepted",
          "not_chosen",
          "withdrawn",
        ],
      }),
    },
  },

  // --- Events ---
  hospiEvents: {
    columns: {
      title: f.valuesFromArray({
        values: [
          "Kennismakingsavond",
          "Huisborrel",
          "Kijkavond",
          "Meet & Greet",
        ],
      }),
      description: f.loremIpsum({ sentencesCount: 2 }),
      eventDate: f.date({ minDate: "2025-01-01", maxDate: "2026-06-01" }),
      timeStart: f.time(),
      timeEnd: f.time(),
      location: f.valuesFromArray({
        values: [
          "In het huis",
          "Café De Vergulde Kater",
          "Online via Zoom",
          "Huiskamer",
        ],
      }),
      maxAttendees: f.int({ minValue: 3, maxValue: 10 }),
    },
    with: {
      hospiInvitations: [
        { weight: 0.6, count: [2, 3] },
        { weight: 0.4, count: [4, 5] },
      ],
    },
  },
  hospiInvitations: {
    columns: {
      status: f.valuesFromArray({
        values: ["pending", "attending", "not_attending", "maybe"],
      }),
    },
  },

  // --- Conversations & Messages ---
  conversations: {
    columns: {
      type: f.default({ defaultValue: "direct" }),
    },
    with: {
      messages: [
        { weight: 0.4, count: [2, 3] },
        { weight: 0.4, count: [4, 5, 6] },
        { weight: 0.2, count: [7, 8, 9] },
      ],
    },
  },
  messages: {
    columns: {
      ciphertext: f.string(),
      iv: f.string(),
      encryptedKeys: f.default({ defaultValue: null }),
      messageType: f.default({ defaultValue: "text" }),
    },
  },

  // --- Security (seeded via profiles.with) ---
  publicKeys: {
    columns: {
      publicKeyJwk: f.default({
        defaultValue: {
          kty: "EC",
          crv: "P-256",
          x: "fake-x-coord",
          y: "fake-y-coord",
        },
      }),
    },
  },
  privateKeyBackups: {
    columns: {
      encryptedPrivateKey: f.string(),
      backupIv: f.string(),
      backupKey: f.string(),
    },
  },
  // blocks, conversationMembers, messageReceipts have composite PKs —
  // drizzle-seed can't guarantee unique combinations, so they stay empty
  reports: {
    count: 10,
    columns: {
      reason: f.valuesFromArray({
        values: ["harassment", "spam", "inappropriate_content"],
      }),
      description: f.loremIpsum({ sentencesCount: 1 }),
      status: f.valuesFromArray({
        values: ["pending", "reviewing", "dismissed"],
      }),
    },
  },

  // --- Notifications ---
  notifications: {
    columns: {
      title: f.valuesFromArray({
        values: [
          "Nieuwe aanmelding",
          "Uitnodiging ontvangen",
          "Bericht ontvangen",
          "Nieuw bericht",
          "Evenement binnenkort",
        ],
      }),
      body: f.loremIpsum({ sentencesCount: 1 }),
      data: f.default({ defaultValue: {} }),
    },
  },
  pushTokens: {
    columns: {
      expoPushToken: f.string({ isUnique: true }),
      deviceType: f.valuesFromArray({ values: ["ios", "android"] }),
    },
  },
  adminAuditLog: {
    count: 3,
    columns: {
      action: f.valuesFromArray({
        values: ["view_report", "dismiss_report", "suspend_user"],
      }),
      targetType: f.valuesFromArray({ values: ["report", "report", "user"] }),
      reason: f.loremIpsum({ sentencesCount: 1 }),
      metadata: f.default({ defaultValue: {} }),
    },
  },

}));

// ── Photo seeding ────────────────────────────────────────────────────

// Local Supabase defaults (well-known dev-only keys)
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY);

// Photo counts per entity (index = entity order, value = number of photos)
const PROFILE_PHOTO_COUNTS = [5, 4, 3, 3, 2, 2, 1, 1, 1, 0];
const ROOM_PHOTO_COUNTS = [8, 5, 4, 3, 2, 1, 1, 0];

async function downloadImage(
  seed: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const url = `https://picsum.photos/seed/${seed}/${width}/${height}.jpg`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

async function seedProfilePhoto(
  userId: string,
  slot: number,
): Promise<string> {
  const imageData = await downloadImage(
    `profile-${userId.slice(0, 8)}-${slot}`,
    400,
    400,
  );
  const path = `${userId}/slot-${slot}.jpg`;

  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, imageData, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  await db
    .insert(schema.profilePhotos)
    .values({ userId, slot, url: path })
    .onConflictDoNothing();

  return path;
}

async function seedRoomPhoto(roomId: string, slot: number): Promise<void> {
  const imageData = await downloadImage(
    `room-${roomId.slice(0, 8)}-${slot}`,
    800,
    600,
  );
  const path = `${roomId}/slot-${slot}.jpg`;

  const { error } = await supabase.storage
    .from("room-photos")
    .upload(path, imageData, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  await db
    .insert(schema.roomPhotos)
    .values({ roomId, slot, url: path })
    .onConflictDoNothing();
}

// Fetch seeded profiles and rooms
const allProfiles = await db
  .select({ id: schema.profiles.id })
  .from(schema.profiles)
  .orderBy(asc(schema.profiles.id));
const allRooms = await db
  .select({ id: schema.rooms.id })
  .from(schema.rooms)
  .orderBy(asc(schema.rooms.id));

// Clean existing storage files (idempotent re-runs)
for (const bucket of ["profile-photos", "room-photos"] as const) {
  const { data: folders } = await supabase.storage.from(bucket).list();
  if (folders) {
    for (const folder of folders) {
      const { data: files } = await supabase.storage
        .from(bucket)
        .list(folder.name);
      if (files?.length) {
        await supabase.storage
          .from(bucket)
          .remove(files.map((f) => `${folder.name}/${f.name}`));
      }
    }
  }
}

// Seed profile photos
console.log("Seeding profile photos...");
for (let i = 0; i < allProfiles.length; i++) {
  const count = PROFILE_PHOTO_COUNTS[i] ?? 0;
  if (count === 0) {
    console.log(`  Profile ${i + 1}: 0 photos (empty state)`);
    continue;
  }

  const userId = allProfiles[i].id;
  const paths = await Promise.all(
    Array.from({ length: count }, (_, slot) =>
      seedProfilePhoto(userId, slot + 1),
    ),
  );

  // Set avatarUrl to slot-1 path (matches app behavior)
  await db
    .update(schema.profiles)
    .set({ avatarUrl: paths[0] })
    .where(eq(schema.profiles.id, userId));

  console.log(`  Profile ${i + 1}: ${count} photos`);
}

// Seed room photos
console.log("Seeding room photos...");
for (let i = 0; i < allRooms.length; i++) {
  const count = ROOM_PHOTO_COUNTS[i] ?? 0;
  if (count === 0) {
    console.log(`  Room ${i + 1}: 0 photos (empty state)`);
    continue;
  }

  const roomId = allRooms[i].id;
  await Promise.all(
    Array.from({ length: count }, (_, slot) =>
      seedRoomPhoto(roomId, slot + 1),
    ),
  );

  console.log(`  Room ${i + 1}: ${count} photos`);
}

console.log("Photo seeding complete.");

await client.end();
console.log("Local database seeded successfully.");
