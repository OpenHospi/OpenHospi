-- Test seed data for local development

-- Test user rows (Better Auth)
INSERT INTO "user" (id, name, email, "emailVerified")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Jan de Vries', '00000000-0000-0000-0000-000000000001@id.openhospi.nl', true),
  ('00000000-0000-0000-0000-000000000002', 'Sophie Bakker', '00000000-0000-0000-0000-000000000002@id.openhospi.nl', true);

-- Test profiles
INSERT INTO profiles (id, first_name, last_name, email, institution_domain, affiliation, gender, bio, study_program, study_year, lifestyle_tags, languages)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Jan',
    'de Vries',
    'j.de.vries@student.rug.nl',
    'rug.nl',
    'student',
    'man',
    'Tweedejaars AI student, op zoek naar een gezellig studentenhuis in Groningen.',
    'Artificial Intelligence',
    2,
    ARRAY['gezellig', 'sporten', 'gamen', 'vroege_vogel']::lifestyle_tag_enum[],
    ARRAY['nl']::language_enum[]
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Sophie',
    'Bakker',
    's.bakker@students.uu.nl',
    'uu.nl',
    'student',
    'vrouw',
    'Derdejaars Psychologie, zoekt rustige huisgenoot in Utrecht.',
    'Psychologie',
    3,
    ARRAY['rustig', 'lezen', 'koken', 'vegetarisch', 'schoon']::lifestyle_tag_enum[],
    ARRAY['nl']::language_enum[]
  );

-- Test room listing
INSERT INTO rooms (id, created_by, title, description, city, neighborhood, rent_price, deposit, utilities_included, room_size_m2, available_from, rental_type, house_type, furnishing, total_housemates, features, location_tags, preferred_gender, status)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'Gezellige kamer in studentenhuis Lombok',
  'Ruime kamer (16m2) in een gezellig studentenhuis in de wijk Lombok, Utrecht. We zijn met z''n vieren en zoeken een vijfde huisgenoot. Het huis heeft een grote woonkamer, tuin en is op loopafstand van het centrum.',
  'utrecht',
  'Lombok',
  450.00,
  450.00,
  FALSE,
  16,
  '2025-03-01',
  'vast',
  'studentenhuis',
  'kaal',
  5,
  ARRAY['gedeelde_badkamer', 'gedeelde_keuken', 'tuin', 'fietsenstalling', 'wasmachine', 'wifi_inbegrepen']::room_feature_enum[],
  ARRAY['dichtbij_centrum', 'dichtbij_ov', 'levendige_buurt']::location_tag_enum[],
  'geen_voorkeur',
  'active'
);

-- Test housemate record
INSERT INTO housemates (room_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'owner'
);
