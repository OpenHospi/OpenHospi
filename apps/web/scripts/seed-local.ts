import {
  STORAGE_BUCKET_PROFILE_PHOTOS,
  STORAGE_BUCKET_ROOM_PHOTOS,
} from "@openhospi/shared/constants";
import { createClient } from "@supabase/supabase-js";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { reset, seed } from "drizzle-seed";
import postgres from "postgres";

import * as schema from "../src/lib/db/schema/index.js";

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
    count: 15,
    columns: {
      name: f.valuesFromArray({
        values: [
          "Daan de Vries",
          "Emma Bakker",
          "Liam Jansen",
          "Sophie Visser",
          "Noah van Dijk",
          "Julia Smit",
          "Sem Mulder",
          "Anna de Boer",
          "Lucas Bos",
          "Mila Hendriks",
          "Finn Peters",
          "Sara Dekker",
          "Jesse van den Berg",
          "Lisa Vermeer",
          "Thijs de Jong",
        ],
      }),
      email: f.valuesFromArray({
        values: [
          "d.devries@student.rug.nl",
          "e.bakker@student.hanze.nl",
          "l.jansen@student.uva.nl",
          "s.visser@student.uu.nl",
          "n.vandijk@student.rug.nl",
          "j.smit@student.eur.nl",
          "s.mulder@student.tue.nl",
          "a.deboer@student.rug.nl",
          "l.bos@student.leidenuniv.nl",
          "m.hendriks@student.tudelft.nl",
          "f.peters@student.ru.nl",
          "s.dekker@student.rug.nl",
          "j.vandenberg@student.vu.nl",
          "l.vermeer@student.rug.nl",
          "t.dejong@student.uu.nl",
        ],
      }),
      emailVerified: f.default({ defaultValue: true }),
      role: f.valuesFromArray({
        values: [
          "admin",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
          "user",
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
      providerId: f.valuesFromArray({ values: ["inacademia"] }),
      scope: f.default({ defaultValue: "openid profile email" }),
    },
  },

  // --- Profiles ---
  profiles: {
    columns: {
      firstName: f.valuesFromArray({
        values: [
          "Daan",
          "Emma",
          "Liam",
          "Sophie",
          "Noah",
          "Julia",
          "Sem",
          "Anna",
          "Lucas",
          "Mila",
          "Finn",
          "Sara",
          "Jesse",
          "Lisa",
          "Thijs",
        ],
      }),
      lastName: f.valuesFromArray({
        values: [
          "de Vries",
          "Bakker",
          "Jansen",
          "Visser",
          "van Dijk",
          "Smit",
          "Mulder",
          "de Boer",
          "Bos",
          "Hendriks",
          "Peters",
          "Dekker",
          "van den Berg",
          "Vermeer",
          "de Jong",
        ],
      }),
      email: f.valuesFromArray({
        values: [
          "d.devries@student.rug.nl",
          "e.bakker@student.hanze.nl",
          "l.jansen@student.uva.nl",
          "s.visser@student.uu.nl",
          "n.vandijk@student.rug.nl",
          "j.smit@student.eur.nl",
          "s.mulder@student.tue.nl",
          "a.deboer@student.rug.nl",
          "l.bos@student.leidenuniv.nl",
          "m.hendriks@student.tudelft.nl",
          "f.peters@student.ru.nl",
          "s.dekker@student.rug.nl",
          "j.vandenberg@student.vu.nl",
          "l.vermeer@student.rug.nl",
          "t.dejong@student.uu.nl",
        ],
      }),
      institutionDomain: f.valuesFromArray({
        values: [
          "rug.nl",
          "hanze.nl",
          "uva.nl",
          "uu.nl",
          "rug.nl",
          "eur.nl",
          "tue.nl",
          "rug.nl",
          "leidenuniv.nl",
          "tudelft.nl",
          "ru.nl",
          "rug.nl",
          "vu.nl",
          "rug.nl",
          "uu.nl",
        ],
      }),
      bio: f.valuesFromArray({
        values: [
          "Derdejaars informatica aan de RUG. Fanatiek wielrenner en hobbychef. Zoek een gezellig studentenhuis in Groningen waar je samen kunt koken en af en toe een huisfeestje houdt.",
          "Tweedejaars verpleegkunde aan de Hanzehogeschool. Hou van hardlopen, series kijken en plantjes verzorgen. Zoek een rustig plekje met fijne huisgenoten.",
          "Eerstejaars rechten aan de UvA. Speelt graag gitaar en gaat vaak naar concerten. Op zoek naar een kamer in Amsterdam met creatieve huisgenoten.",
          "Master psychologie aan de Universiteit Utrecht. Fan van yoga, boeken en lange wandelingen. Zoekt een rustige kamer bij mensen die hun studie serieus nemen.",
          "Derdejaars bedrijfskunde aan de RUG. Actief bij een studentenvereniging en houdt van borrels, zeilen en koken voor de hele gang.",
          "Tweedejaars economie aan de EUR. Houdt van hockey, quizavonden en uitgebreid ontbijten in het weekend. Zoekt een sociaal huis in Rotterdam.",
          "Eerstejaars werktuigbouwkunde aan de TU/e. Gamer, techliefhebber en altijd in voor een potje tafelvoetbal. Rustig maar gezellig.",
          "Tweedejaars biomedische wetenschappen aan de RUG. Draait graag vinyl, houdt van vintage winkelen en experimenteert in de keuken.",
          "Derdejaars geschiedenis aan de Universiteit Leiden. Leest veel, bezoekt musea en gaat graag op weekendtrip. Zoekt een huisje met karakter.",
          "Master bouwkunde aan de TU Delft. Houdt van fietsen, fotografie en duurzaam leven. Zoekt een schoon en georganiseerd huis.",
          "Tweedejaars politicologie aan de Radboud. Debatvriend, filmfanaat en kookt graag Italiaans. Op zoek naar een huis met avondlijke gesprekken.",
          "Eerstejaars tandheelkunde aan de RUG. Tennisster, social media-lover en altijd in voor spontane uitjes. Zoekt een levendig huis.",
          "Master AI aan de VU Amsterdam. Introvert maar hartelijk, speelt piano en houdt van Japanse cultuur. Zoekt een rustig huis.",
          "Derdejaars biologie aan de RUG. Houdt van zeilen, kamperen en natuur. Zoekt een duurzaam studentenhuis in Groningen.",
          "Eerstejaars geneeskunde aan de UU. Roeier, voetbalfan en houdt van spelletjesavonden. Op zoek naar een actief en gezellig huis.",
        ],
      }),
      studyProgram: f.valuesFromArray({
        values: [
          "Informatica",
          "Verpleegkunde",
          "Rechten",
          "Psychologie",
          "Bedrijfskunde",
          "Economie",
          "Werktuigbouwkunde",
          "Biomedische wetenschappen",
          "Geschiedenis",
          "Bouwkunde",
          "Politicologie",
          "Tandheelkunde",
          "Artificial Intelligence",
          "Biologie",
          "Geneeskunde",
        ],
      }),
      studyLevel: f.valuesFromArray({
        values: [
          "wo_bachelor",
          "hbo_bachelor",
          "wo_bachelor",
          "master",
          "wo_bachelor",
          "wo_bachelor",
          "wo_bachelor",
          "wo_bachelor",
          "wo_bachelor",
          "master",
          "wo_bachelor",
          "wo_bachelor",
          "master",
          "wo_bachelor",
          "wo_bachelor",
        ],
      }),
      birthDate: f.valuesFromArray({
        values: [
          "2001-03-15",
          "2002-07-22",
          "2003-11-08",
          "1999-05-30",
          "2001-09-12",
          "2002-01-18",
          "2003-06-25",
          "2002-04-03",
          "2000-12-19",
          "1999-08-07",
          "2002-02-14",
          "2003-10-29",
          "1998-11-16",
          "2001-06-21",
          "2003-03-04",
        ],
      }),
      preferredCity: f.valuesFromArray({
        values: [
          "groningen",
          "groningen",
          "amsterdam",
          "utrecht",
          "groningen",
          "rotterdam",
          "eindhoven",
          "groningen",
          "leiden",
          "delft",
          "nijmegen",
          "groningen",
          "amsterdam",
          "groningen",
          "utrecht",
        ],
      }),
      gender: f.valuesFromArray({
        values: [
          "male",
          "female",
          "male",
          "female",
          "male",
          "female",
          "male",
          "female",
          "male",
          "female",
          "male",
          "female",
          "male",
          "female",
          "male",
        ],
      }),
      lifestyleTags: f.valuesFromArray({
        values: [
          ["sociable", "cooking", "sports", "early_bird"],
          ["quiet", "reading", "sustainable", "tidy"],
          ["extrovert", "music", "nightlife", "creative"],
          ["quiet", "reading", "studying", "tidy"],
          ["sociable", "sports", "partying", "cooking"],
          ["extrovert", "sports", "cooking", "movie_night"],
          ["introvert", "gaming", "night_owl", "relaxed_cleaning"],
          ["sociable", "creative", "cooking", "music"],
          ["introvert", "reading", "traveling", "sustainable"],
          ["tidy", "sustainable", "sports", "early_bird"],
          ["sociable", "cooking", "movie_night", "inclusive"],
          ["extrovert", "nightlife", "sports", "sociable"],
          ["introvert", "studying", "quiet", "reading"],
          ["sociable", "sustainable", "sports", "traveling"],
          ["extrovert", "sports", "cooking", "sociable"],
        ],
      }),
      languages: f.valuesFromArray({
        values: [
          ["nl", "en"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en", "fr"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en", "fr"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en", "ja"],
          ["nl", "en"],
          ["nl", "en"],
        ],
      }),
      vereniging: f.default({ defaultValue: null }),
      preferredLocale: f.valuesFromArray({
        values: [
          "nl",
          "nl",
          "en",
          "nl",
          "nl",
          "nl",
          "nl",
          "nl",
          "en",
          "en",
          "nl",
          "nl",
          "en",
          "nl",
          "nl",
        ],
      }),
    },
    with: {
      devices: 1,
      privateKeyBackups: 1,
      notifications: 1,
      pushTokens: 1,
    },
  },

  // --- Houses ---
  houses: {
    count: 10,
    columns: {
      name: f.valuesFromArray({
        values: [
          "Casa de Vries",
          "Studentenhuis Bakker",
          "Huize Zonneveld",
          "Het Groene Huis",
          "Villa Academica",
          "Huis aan de Gracht",
          "De Oude Brouwerij",
          "Studentenflat Paddepoelster",
          "Het Zonnehuis",
          "Kameraden aan de Kanal",
        ],
      }),
    },
    with: {
      houseMembers: [
        { weight: 0.3, count: 1 },
        { weight: 0.4, count: 2 },
        { weight: 0.3, count: 3 },
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
    count: 20,
    columns: {
      title: f.valuesFromArray({
        values: [
          // Groningen (7)
          "Ruime kamer in Paddepoel",
          "Gezellige kamer bij Noorderplantsoen",
          "Lichte hoekstudio Centrum",
          "Kamer met balkon Oosterpoort",
          "Studentenkamer Zernike-campus",
          "Rustige kamer in Selwerd",
          "Gemeubileerde kamer Binnenstad",
          // Amsterdam (3)
          "Studio nabij Vondelpark",
          "Kamer in De Pijp",
          "Gezellige zolder Jordaan",
          // Utrecht (3)
          "Kamer aan de Oudegracht",
          "Studentenkamer Uithof",
          "Lichte kamer Lombok",
          // Rotterdam (2)
          "Kamer bij Erasmusbrug",
          "Studio Kralingen",
          // Leiden (2)
          "Kamer in Leidse Binnenstad",
          "Studio bij Leiden Centraal",
          // Eindhoven (1)
          "Kamer op Strijp-S",
          // Nijmegen (1)
          "Kamer bij Radboud-campus",
          // Delft (1)
          "Studio nabij TU Delft",
        ],
      }),
      description: f.valuesFromArray({
        values: [
          // Groningen (7)
          "Ruime kamer van 18m² op de eerste verdieping in een gezellig studentenhuis in Paddepoel. Op fietsafstand van de RUG en het centrum. Gedeelde keuken met vaatwasser. Rustige straat, fijne huisgenoten.",
          "Lichte kamer van 16m² met uitzicht op het Noorderplantsoen. Twee minuten fietsen naar de binnenstad. Gedeelde badkamer met 1 huisgenoot. Inclusief wifi en wasmachine.",
          "Hoekstudio van 22m² in het centrum van Groningen met eigen keukenblok. Ideaal voor wie privacy waardeert maar toch sociaal wil wonen. Huisgenoten organiseren regelmatig filmavonden.",
          "Kamer van 15m² met eigen balkon en uitzicht over de stad. Gelegen in de levendige Oosterpoort, vlakbij supermarkt en sportcentrum. Gedeelde keuken met 4 huisgenoten.",
          "Kamer van 14m² op loopafstand van de Zernike-campus. Ideaal voor bèta-studenten. Gedeelde keuken en tuin. Rustige buurt, goede busverbinding naar het centrum.",
          "Rustige kamer van 17m² in Selwerd, vlakbij het UMCG. Gedeelde badkamer en keuken met 3 huisgenoten. Grote tuin beschikbaar. Perfecte plek voor wie rust zoekt.",
          "Volledig gemeubileerde kamer van 20m² in de binnenstad van Groningen. Op loopafstand van de Grote Markt. Alles aanwezig: bed, bureau, kast, lamp. Direct beschikbaar.",
          // Amsterdam (3)
          "Lichte studio van 24m² nabij het Vondelpark in Amsterdam-Zuid. Eigen badkamer en keukenblok. Op 5 minuten fietsen van de UvA-campus. Rustige buurt met veel groen.",
          "Gezellige kamer van 16m² in het hart van De Pijp. Levendige buurt met de Albert Cuypmarkt om de hoek. Gedeelde keuken, huisgenoten zijn sociaal en studeren allemaal.",
          "Sfeervolle zolderkamer van 18m² in de Jordaan met schuine wanden en dakraam. Karakteristiek Amsterdams pand. Gedeelde keuken en badkamer. Midden in het centrum.",
          // Utrecht (3)
          "Kamer van 15m² aan de Oudegracht, het kloppend hart van Utrecht. Op loopafstand van de universiteit. Gedeelde keuken met 5 huisgenoten. Levendige studentenbuurt.",
          "Moderne kamer van 18m² op De Uithof, vlakbij de universiteitsgebouwen. Ideaal voor wie graag op de campus woont. Inclusief fietsenstalling en snelle wifi.",
          "Lichte kamer van 16m² in de multiculturele wijk Lombok. Gezellige buurt met veel restaurants en winkels. Gedeelde keuken, kleine tuin op het zuiden.",
          // Rotterdam (2)
          "Kamer van 17m² met uitzicht op de Erasmusbrug. Moderne flat met gedeelde keuken en wasruimte. Op loopafstand van de EUR-campus. Bruisend stadsleven.",
          "Ruime studio van 25m² in Kralingen met eigen keuken en badkamer. Vlakbij het Kralingse Bos. Rustige woonwijk, ideaal voor wie privacy zoekt.",
          // Leiden (2)
          "Sfeervolle kamer van 14m² in een monumentaal pand in de Leidse binnenstad. Vlakbij de universiteit en kroegen. Gedeelde keuken en badkamer.",
          "Studio van 20m² op loopafstand van Leiden Centraal. Eigen keukenblok, gedeelde badkamer. Perfecte uitvalsbasis voor pendelen naar Den Haag.",
          // Eindhoven (1)
          "Moderne kamer van 19m² op het creatieve Strijp-S. Voormalig Philipsterrein met hippe restaurants en galleries. Gedeelde keuken, inclusief wifi. Fietsen naar TU/e in 10 minuten.",
          // Nijmegen (1)
          "Kamer van 16m² op 5 minuten fietsen van de Radboud-campus. Gezellig studentenhuis met gezamenlijke eetavonden. Gedeelde keuken en tuin. Nabij Heyendaal.",
          // Delft (1)
          "Nette studio van 22m² nabij de TU Delft-campus. Eigen badkamer, gedeelde keuken met 2 huisgenoten. Fietsstalling in het gebouw. Rustige straat.",
        ],
      }),
      city: f.valuesFromArray({
        values: [
          // Groningen x7
          "groningen",
          "groningen",
          "groningen",
          "groningen",
          "groningen",
          "groningen",
          "groningen",
          // Amsterdam x3
          "amsterdam",
          "amsterdam",
          "amsterdam",
          // Utrecht x3
          "utrecht",
          "utrecht",
          "utrecht",
          // Rotterdam x2
          "rotterdam",
          "rotterdam",
          // Leiden x2
          "leiden",
          "leiden",
          // Eindhoven x1
          "eindhoven",
          // Nijmegen x1
          "nijmegen",
          // Delft x1
          "delft",
        ],
      }),
      neighborhood: f.valuesFromArray({
        values: [
          "Paddepoel",
          "Centrum",
          "Centrum",
          "Oosterpoort",
          "Zernike",
          "Selwerd",
          "Binnenstad",
          "Zuid",
          "De Pijp",
          "Jordaan",
          "Binnenstad",
          "De Uithof",
          "Lombok",
          "Centrum",
          "Kralingen",
          "Binnenstad",
          "Centrum",
          "Strijp-S",
          "Heyendaal",
          "Centrum",
        ],
      }),
      streetName: f.valuesFromArray({
        values: [
          // Groningen (7)
          "Zonnelaan",
          "Nieuwe Boteringestraat",
          "Gelkingestraat",
          "Oosterstraat",
          "Zernikelaan",
          "Irisweg",
          "Folkingestraat",
          // Amsterdam (3)
          "Van Baerlestraat",
          "Ferdinand Bolstraat",
          "Bloemgracht",
          // Utrecht (3)
          "Oudegracht",
          "Heidelberglaan",
          "Kanaalstraat",
          // Rotterdam (2)
          "Boompjes",
          "Kralingse Plaslaan",
          // Leiden (2)
          "Rapenburg",
          "Stationsweg",
          // Eindhoven (1)
          "Torenallee",
          // Nijmegen (1)
          "Heyendaalseweg",
          // Delft (1)
          "Mekelweg",
        ],
      }),
      houseNumber: f.valuesFromArray({
        values: [
          "12",
          "45",
          "8a",
          "62",
          "3",
          "21",
          "17",
          "88",
          "34",
          "52",
          "142",
          "5",
          "78",
          "29",
          "16",
          "33",
          "11",
          "24",
          "95",
          "7",
        ],
      }),
      postalCode: f.valuesFromArray({
        values: [
          // Groningen (7)
          "9742 GR",
          "9712 SG",
          "9711 NE",
          "9711 NR",
          "9747 AA",
          "9742 JE",
          "9711 JW",
          // Amsterdam (3)
          "1071 BB",
          "1072 MH",
          "1015 TM",
          // Utrecht (3)
          "3511 LP",
          "3584 CS",
          "3531 CJ",
          // Rotterdam (2)
          "3011 XZ",
          "3061 ME",
          // Leiden (2)
          "2311 GJ",
          "2312 AS",
          // Eindhoven (1)
          "5617 BC",
          // Nijmegen (1)
          "6525 AJ",
          // Delft (1)
          "2628 CD",
        ],
      }),
      latitude: f.valuesFromArray({
        values: [
          // Groningen (7)
          53.2254, 53.219, 53.2174, 53.2138, 53.2405, 53.228, 53.2148,
          // Amsterdam (3)
          52.3579, 52.3548, 52.3751,
          // Utrecht (3)
          52.0907, 52.0852, 52.0933,
          // Rotterdam (2)
          51.9185, 51.9267,
          // Leiden (2)
          52.1583, 52.166,
          // Eindhoven (1)
          51.4484,
          // Nijmegen (1)
          51.8206,
          // Delft (1)
          52.0024,
        ],
      }),
      longitude: f.valuesFromArray({
        values: [
          // Groningen (7)
          6.5488, 6.562, 6.5685, 6.572, 6.5335, 6.545, 6.5695,
          // Amsterdam (3)
          4.8776, 4.8938, 4.8788,
          // Utrecht (3)
          5.1214, 5.1747, 5.1031,
          // Rotterdam (2)
          4.489, 4.493,
          // Leiden (2)
          4.4889, 4.4865,
          // Eindhoven (1)
          5.4533,
          // Nijmegen (1)
          5.8713,
          // Delft (1)
          4.3735,
        ],
      }),
      rentPrice: f.valuesFromArray({
        values: [
          // Groningen (affordable)
          "380",
          "420",
          "480",
          "350",
          "320",
          "370",
          "460",
          // Amsterdam (expensive)
          "750",
          "680",
          "720",
          // Utrecht
          "520",
          "490",
          "510",
          // Rotterdam
          "550",
          "620",
          // Leiden
          "480",
          "530",
          // Eindhoven
          "470",
          // Nijmegen
          "430",
          // Delft
          "560",
        ],
      }),
      deposit: f.valuesFromArray({
        values: [
          "380",
          "420",
          "480",
          "350",
          "320",
          "370",
          "460",
          "750",
          "680",
          "720",
          "520",
          "490",
          "510",
          "550",
          "620",
          "480",
          "530",
          "470",
          "430",
          "560",
        ],
      }),
      serviceCosts: f.valuesFromArray({
        values: [
          "50",
          "60",
          "75",
          "45",
          "40",
          "50",
          "65",
          "90",
          "80",
          "85",
          "70",
          "60",
          "65",
          "75",
          "80",
          "55",
          "65",
          "60",
          "55",
          "70",
        ],
      }),
      utilitiesIncluded: f.valuesFromArray({
        values: [
          "not_included",
          "estimated",
          "not_included",
          "included",
          "not_included",
          "estimated",
          "included",
          "not_included",
          "estimated",
          "not_included",
          "not_included",
          "estimated",
          "included",
          "not_included",
          "estimated",
          "not_included",
          "not_included",
          "estimated",
          "not_included",
          "included",
        ],
      }),
      estimatedUtilitiesCosts: f.valuesFromArray({
        values: [
          null,
          "75",
          null,
          null,
          null,
          "80",
          null,
          null,
          "65",
          null,
          null,
          "70",
          null,
          null,
          "85",
          null,
          null,
          "60",
          null,
          null,
        ],
      }),
      roomSizeM2: f.valuesFromArray({
        values: [18, 16, 22, 15, 14, 17, 20, 24, 16, 18, 15, 18, 16, 17, 25, 14, 20, 19, 16, 22],
      }),
      rentalType: f.valuesFromArray({
        values: [
          "permanent",
          "permanent",
          "temporary",
          "permanent",
          "permanent",
          "permanent",
          "sublet",
          "permanent",
          "temporary",
          "permanent",
          "permanent",
          "permanent",
          "temporary",
          "permanent",
          "sublet",
          "permanent",
          "permanent",
          "permanent",
          "permanent",
          "permanent",
        ],
      }),
      houseType: f.valuesFromArray({
        values: [
          "student_house",
          "student_house",
          "studio",
          "student_house",
          "student_house",
          "living_group",
          "student_house",
          "studio",
          "student_house",
          "student_house",
          "student_house",
          "apartment",
          "student_house",
          "apartment",
          "studio",
          "student_house",
          "studio",
          "apartment",
          "student_house",
          "studio",
        ],
      }),
      furnishing: f.valuesFromArray({
        values: [
          "semi_furnished",
          "unfurnished",
          "furnished",
          "semi_furnished",
          "unfurnished",
          "semi_furnished",
          "furnished",
          "furnished",
          "unfurnished",
          "semi_furnished",
          "unfurnished",
          "furnished",
          "semi_furnished",
          "semi_furnished",
          "furnished",
          "unfurnished",
          "furnished",
          "furnished",
          "semi_furnished",
          "furnished",
        ],
      }),
      totalHousemates: f.valuesFromArray({
        values: [5, 4, 1, 5, 6, 4, 3, 1, 4, 3, 6, 2, 4, 3, 1, 5, 1, 3, 5, 2],
      }),
      status: f.valuesFromArray({
        values: [
          // 15 active
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          "active",
          // 2 draft
          "draft",
          "draft",
          // 2 paused
          "paused",
          "paused",
          // 1 closed
          "closed",
        ],
      }),
      roomVereniging: f.default({ defaultValue: null }),
      availableUntil: f.default({ defaultValue: null }),
      preferredGender: f.valuesFromArray({
        values: [
          "no_preference",
          "no_preference",
          "no_preference",
          "male",
          "no_preference",
          "no_preference",
          "male",
          "no_preference",
          "female",
          "no_preference",
          "no_preference",
          "no_preference",
          "no_preference",
          "no_preference",
          "female",
          "no_preference",
          "no_preference",
          "male",
          "no_preference",
          "no_preference",
        ],
      }),
      availableFrom: f.valuesFromArray({
        values: [
          "2026-03-01",
          "2026-03-15",
          "2026-04-01",
          "2026-03-01",
          "2026-05-01",
          "2026-04-15",
          "2026-06-01",
          "2026-03-15",
          "2026-04-01",
          "2026-05-01",
          "2026-03-01",
          "2026-03-15",
          "2026-04-01",
          "2026-05-01",
          "2026-06-01",
          "2026-07-01",
          "2026-08-01",
          "2026-03-01",
          "2026-04-01",
          "2026-05-01",
        ],
      }),
      features: f.valuesFromArray({
        values: [
          ["shared_kitchen", "bike_storage", "wifi_included", "dishwasher", "no_smoking"],
          ["shared_kitchen", "shared_bathroom", "bike_storage", "wifi_included", "washing_machine"],
          ["private_kitchen", "shared_bathroom", "wifi_included", "bike_storage", "no_pets"],
          ["shared_kitchen", "balcony", "bike_storage", "wifi_included", "no_smoking"],
          ["shared_kitchen", "garden", "bike_storage", "wifi_included", "pets_allowed"],
          [
            "shared_kitchen",
            "shared_bathroom",
            "garden",
            "bike_storage",
            "wifi_included",
            "washing_machine",
          ],
          [
            "shared_kitchen",
            "private_bathroom",
            "wifi_included",
            "bike_storage",
            "washing_machine",
            "dryer",
          ],
          ["private_bathroom", "private_kitchen", "wifi_included", "bike_storage", "no_smoking"],
          ["shared_kitchen", "shared_bathroom", "bike_storage", "wifi_included", "no_pets"],
          ["shared_kitchen", "shared_bathroom", "wifi_included", "bike_storage", "storage"],
          ["shared_kitchen", "shared_bathroom", "bike_storage", "wifi_included", "no_smoking"],
          ["shared_kitchen", "wifi_included", "bike_storage", "washing_machine", "parking"],
          ["shared_kitchen", "shared_bathroom", "garden", "wifi_included", "bike_storage"],
          ["shared_kitchen", "shared_bathroom", "wifi_included", "washing_machine", "bike_storage"],
          ["private_bathroom", "private_kitchen", "wifi_included", "parking", "bike_storage"],
          ["shared_kitchen", "shared_bathroom", "bike_storage", "wifi_included"],
          ["private_kitchen", "shared_bathroom", "wifi_included", "bike_storage"],
          ["shared_kitchen", "wifi_included", "bike_storage", "washing_machine", "balcony"],
          ["shared_kitchen", "garden", "bike_storage", "wifi_included", "dishwasher"],
          ["private_bathroom", "shared_kitchen", "wifi_included", "bike_storage"],
        ],
      }),
      locationTags: f.valuesFromArray({
        values: [
          ["near_supermarket", "near_transit", "quiet_neighborhood"],
          ["near_park", "near_center", "near_university"],
          ["near_center", "near_nightlife", "near_supermarket"],
          ["near_center", "near_sports_center", "lively_neighborhood"],
          ["near_university", "quiet_neighborhood", "near_transit"],
          ["near_university", "quiet_neighborhood", "near_park"],
          ["near_center", "near_nightlife", "near_supermarket", "near_station"],
          ["near_park", "near_transit", "quiet_neighborhood"],
          ["near_center", "lively_neighborhood", "near_nightlife"],
          ["near_center", "lively_neighborhood", "near_station"],
          ["near_center", "near_university", "near_station"],
          ["near_university", "near_transit", "quiet_neighborhood"],
          ["near_supermarket", "lively_neighborhood", "near_transit"],
          ["near_center", "near_university", "near_station"],
          ["near_park", "quiet_neighborhood", "near_transit"],
          ["near_center", "near_university", "near_nightlife"],
          ["near_station", "near_supermarket", "near_center"],
          ["lively_neighborhood", "near_transit", "near_nightlife"],
          ["near_university", "near_park", "quiet_neighborhood"],
          ["near_university", "near_station", "near_supermarket"],
        ],
      }),
      preferredAgeMin: f.valuesFromArray({
        values: [18, 19, 20, 18, 18, 19, 20, 21, 19, 20, 18, 18, 20, 19, 21, 18, 19, 20, 18, 20],
      }),
      preferredAgeMax: f.valuesFromArray({
        values: [27, 28, 29, 26, 27, 27, 28, 29, 27, 28, 27, 26, 29, 27, 29, 28, 27, 28, 27, 29],
      }),
      acceptedLanguages: f.valuesFromArray({
        values: [
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl"],
          ["nl", "en"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en", "fr"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en"],
          ["nl", "en", "de"],
          ["nl", "en"],
          ["nl", "en"],
        ],
      }),
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
      personalMessage: f.valuesFromArray({
        values: [
          "Hoi! Ik ben op zoek naar een gezellig studentenhuis en jullie huis spreekt me erg aan. Ik kook graag voor huisgenoten en ben altijd in voor een spelletjesavond.",
          "Hey, ik zag jullie kamer op OpenHospi en het lijkt me een perfecte match! Ik studeer in de buurt en zoek een rustige plek om te wonen.",
          "Hallo! Ik ben een nette en sociale student die graag samen eet en af en toe een biertje drinkt. Jullie huis ziet er super uit!",
          "Hi, ik ben erg geïnteresseerd in de kamer. Ik hou van een schoon huis en respecteer ieders ruimte. Zou graag langskomen voor een kennismaking!",
          "Hoi! Ik zoek al een tijdje een kamer en jullie huis past precies bij wat ik zoek. Ik ben sociaal maar ook graag soms op mijn kamer.",
          "Hey! Wat een leuke advertentie. Ik studeer hier in de stad en zoek een huis met gezellige huisgenoten. Ik neem mijn plantencollectie mee!",
          "Hallo, ik reageer op jullie kamer. Ik ben een rustige student die graag leest en af en toe kookt. Op zoek naar een fijne woonomgeving.",
          "Hi! Ik ben een tweedejaars student en zoek mijn eerste kamer op kamers. Jullie huis lijkt me super leuk en de locatie is perfect voor mij.",
          "Hoi! Ik ben net begonnen met mijn studie en zoek een studentenhuis waar ik me thuis kan voelen. Ik ben sportief en hou van koken.",
          "Hey, jullie kamer ziet er fantastisch uit! Ik ben een nette bewoner die graag bijdraagt aan een gezellige sfeer in huis.",
          "Hallo! Ik ben op zoek naar een kamer dicht bij de universiteit. Ik ben studious maar ook sociaal — ideale huisgenoot, al zeg ik het zelf!",
        ],
      }),
      status: f.valuesFromArray({
        values: [
          "sent",
          "seen",
          "liked",
          "maybe",
          "rejected",
          "hospi",
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
        values: ["Kennismakingsavond", "Huisborrel", "Kijkavond", "Meet & Greet"],
      }),
      description: f.valuesFromArray({
        values: [
          "Kom langs voor een gezellige kennismaking! We bereiden hapjes voor en je kunt het huis en alle huisgenoten ontmoeten.",
          "Informele borrel om kennis te maken. Neem gerust een drankje mee, wij zorgen voor de snacks!",
          "Een avond om het huis te bekijken en te zien of er een klik is. We laten je de kamer zien en vertellen over ons huisleven.",
          "Korte ontmoeting om te kijken of het klikt. Kom gewoon langs, geen druk!",
        ],
      }),
      eventDate: f.valuesFromArray({
        values: [
          "2026-03-15",
          "2026-03-22",
          "2026-04-05",
          "2026-04-12",
          "2026-04-19",
          "2026-05-03",
          "2026-05-10",
          "2026-05-24",
          "2026-06-07",
          "2026-06-14",
          "2026-06-28",
          "2026-07-05",
          "2026-07-19",
          "2026-08-02",
          "2026-08-16",
          "2026-08-30",
          "2026-09-06",
          "2026-09-13",
          "2026-09-20",
          "2026-09-27",
        ],
      }),
      timeStart: f.valuesFromArray({
        values: [
          "18:00",
          "19:00",
          "18:30",
          "19:30",
          "18:00",
          "19:00",
          "18:30",
          "19:00",
          "18:00",
          "19:30",
          "18:30",
          "19:00",
          "18:00",
          "19:00",
          "18:30",
          "19:00",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
        ],
      }),
      timeEnd: f.valuesFromArray({
        values: [
          "20:00",
          "21:00",
          "20:30",
          "21:30",
          "20:00",
          "21:00",
          "20:30",
          "21:00",
          "20:00",
          "21:30",
          "20:30",
          "21:00",
          "20:00",
          "21:00",
          "20:30",
          "21:00",
          "20:00",
          "20:30",
          "21:00",
          "21:30",
        ],
      }),
      location: f.valuesFromArray({
        values: ["In het huis", "Café De Vergulde Kater", "Online via Zoom", "Huiskamer"],
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
      messageType: f.default({ defaultValue: "text" }),
    },
    with: {
      messagePayloads: 1,
    },
  },
  messagePayloads: {
    columns: {
      ciphertext: f.string(),
      iv: f.string(),
      signature: f.string(),
      chainIteration: f.int({ minValue: 0, maxValue: 100 }),
      chainId: f.string(),
    },
  },

  // --- Security (seeded via profiles.with) ---
  devices: {
    columns: {
      deviceId: f.int({ minValue: 1, maxValue: 3 }),
      registrationId: f.int({ minValue: 10000, maxValue: 99999 }),
      identityKeyPublic: f.string(),
      platform: f.valuesFromArray({ values: ["web", "ios", "android"] }),
    },
  },
  privateKeyBackups: {
    columns: {
      encryptedPrivateKey: f.string(),
      backupIv: f.string(),
      backupKey: f.string(),
    },
  },
  // Tables with composite/single-column PKs where drizzle-seed can't guarantee unique
  // combinations, so they stay empty: blocks, conversationMembers, messageReceipts,
  // activeConsents, calendarTokens (userId is PK — one token per user)
  activeConsents: { count: 0 },
  calendarTokens: { count: 0 },
  reports: {
    count: 10,
    columns: {
      reason: f.valuesFromArray({
        values: ["harassment", "spam", "inappropriate_content"],
      }),
      description: f.valuesFromArray({
        values: [
          "Gebruiker stuurde herhaaldelijk ongewenste berichten na afwijzing.",
          "Profiel bevat reclame voor externe diensten.",
          "Ongepaste foto's op het profiel geplaatst.",
          "Beledigende taal in chatberichten.",
          "Kameradvertentie bevat misleidende informatie.",
          "Spam-berichten naar meerdere gebruikers.",
          "Ongepast gedrag tijdens hospi-avond.",
          "Valse identiteit op profiel.",
          "Discriminerende opmerkingen in chat.",
          "Herhaaldelijke spam in chatberichten.",
        ],
      }),
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
      body: f.valuesFromArray({
        values: [
          "Er is een nieuwe aanmelding voor je kamer.",
          "Je bent uitgenodigd voor een hospi-avond!",
          "Je hebt een nieuw bericht ontvangen.",
          "Er is een reactie op je aanmelding.",
          "Je hospi-evenement begint binnenkort.",
        ],
      }),
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
      reason: f.valuesFromArray({
        values: [
          "Rapport bekeken voor beoordeling.",
          "Geen schending van richtlijnen gevonden.",
          "Herhaaldelijke overtredingen van de gedragscode.",
        ],
      }),
      metadata: f.default({ defaultValue: {} }),
    },
  },
}));

// ── Fix availableUntil for non-permanent rooms ──────────────────────
// drizzle-seed shuffles column values independently, so we can't rely
// on array index alignment. Instead, set availableUntil post-seed based
// on actual rentalType and availableFrom values.
await db
  .update(schema.rooms)
  .set({
    availableUntil: sql`(${schema.rooms.availableFrom}::date + interval '5 months')::date`,
  })
  .where(inArray(schema.rooms.rentalType, ["temporary", "sublet"]));

// ── Photo seeding ────────────────────────────────────────────────────

// Local Supabase defaults (well-known dev-only keys)
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"; // eslint-disable-line no-secrets/no-secrets -- well-known Supabase local dev key
const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY);

// Photo counts per entity (index = entity order, value = number of photos)
const PROFILE_PHOTO_COUNTS = [5, 4, 3, 3, 2, 2, 1, 1, 1, 3, 2, 4, 1, 3, 0];
const ROOM_PHOTO_COUNTS = [8, 5, 4, 3, 2, 1, 1, 5, 3, 4, 2, 3, 1, 4, 6, 2, 3, 5, 1, 0];

async function downloadImage(seed: string, width: number, height: number): Promise<Buffer> {
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

async function seedProfilePhoto(userId: string, slot: number): Promise<string> {
  const imageData = await downloadImage(`profile-${userId.slice(0, 8)}-${slot}`, 400, 400);
  const path = `${userId}/slot-${slot}.jpg`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_PROFILE_PHOTOS)
    .upload(path, imageData, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  await db.insert(schema.profilePhotos).values({ userId, slot, url: path }).onConflictDoNothing();

  return path;
}

async function seedRoomPhoto(roomId: string, slot: number): Promise<void> {
  const imageData = await downloadImage(`room-${roomId.slice(0, 8)}-${slot}`, 800, 600);
  const path = `${roomId}/slot-${slot}.jpg`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_ROOM_PHOTOS)
    .upload(path, imageData, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;

  await db.insert(schema.roomPhotos).values({ roomId, slot, url: path }).onConflictDoNothing();
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
for (const bucket of [STORAGE_BUCKET_PROFILE_PHOTOS, STORAGE_BUCKET_ROOM_PHOTOS] as const) {
  const { data: folders } = await supabase.storage.from(bucket).list();
  if (folders) {
    for (const folder of folders) {
      const { data: files } = await supabase.storage.from(bucket).list(folder.name);
      if (files?.length) {
        await supabase.storage.from(bucket).remove(files.map((f) => `${folder.name}/${f.name}`));
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
    Array.from({ length: count }, (_, slot) => seedProfilePhoto(userId, slot + 1)),
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
  await Promise.all(Array.from({ length: count }, (_, slot) => seedRoomPhoto(roomId, slot + 1)));

  console.log(`  Room ${i + 1}: ${count} photos`);
}

console.log("Photo seeding complete.");

await client.end();
console.log("Local database seeded successfully.");
