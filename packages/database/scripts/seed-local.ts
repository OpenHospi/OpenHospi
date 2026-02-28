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
        values: ["man", "vrouw", "zeg_ik_liever_niet"],
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
        values: ["vast", "tijdelijk", "onderhuur"],
      }),
      houseType: f.valuesFromArray({
        values: ["studentenhuis", "appartement", "studio", "woongroep"],
      }),
      furnishing: f.valuesFromArray({
        values: ["kaal", "gestoffeerd", "gemeubileerd"],
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
        values: ["geen_voorkeur", "man", "vrouw", "geen_voorkeur"],
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

await client.end();
console.log("Local database seeded successfully.");
