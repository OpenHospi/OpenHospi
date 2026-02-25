-- Migration: Expand city_enum, create vereniging_enum, convert TEXT→ENUM,
-- drop is_verenigingshuis (derive from room_vereniging IS NOT NULL), update RLS.

-- ============================================================================
-- 1. Expand city_enum — add 30 new values (28 CBS 50k+ cities + 2 student cities)
-- ============================================================================
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'zoetermeer';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'amstelveen';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'alkmaar';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'hilversum';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'lelystad';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'purmerend';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'hengelo';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'zaandam';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'schiedam';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'hoofddorp';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'ede';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'gouda';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'hoorn';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'vlaardingen';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'alphen_aan_den_rijn';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'spijkenisse';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'almelo';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'assen';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'veenendaal';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'capelle_aan_den_ijssel';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'roosendaal';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'nieuwegein';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'heerhugowaard';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'oss';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'emmen';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'rijswijk';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'zeist';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'bergen_op_zoom';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'dronten';
ALTER TYPE city_enum ADD VALUE IF NOT EXISTS 'terschelling';

-- Remove 'anders' from city_enum:
-- PG doesn't support DROP VALUE, so we recreate the type.
-- Step 1: Migrate columns to TEXT temporarily
ALTER TABLE profiles ALTER COLUMN preferred_city TYPE TEXT USING preferred_city::TEXT;
ALTER TABLE rooms ALTER COLUMN city TYPE TEXT USING city::TEXT;

-- Step 2: Update any rows using 'anders' to a reasonable default
UPDATE profiles SET preferred_city = 'amsterdam' WHERE preferred_city = 'anders';
UPDATE rooms SET city = 'amsterdam' WHERE city = 'anders';

-- Step 3: Drop old type, create new without 'anders', re-apply
DROP TYPE city_enum;
CREATE TYPE city_enum AS ENUM (
  'amsterdam', 'rotterdam', 'den_haag', 'utrecht', 'groningen',
  'eindhoven', 'tilburg', 'nijmegen', 'enschede', 'arnhem',
  'leiden', 'maastricht', 'delft', 'breda', 'leeuwarden',
  'zwolle', 'den_bosch', 'haarlem', 'wageningen', 'middelburg',
  'vlissingen', 'deventer', 'apeldoorn', 'amersfoort', 'almere',
  'dordrecht', 'heerlen', 'sittard', 'venlo', 'helmond',
  'zoetermeer', 'amstelveen', 'alkmaar', 'hilversum', 'lelystad',
  'purmerend', 'hengelo', 'zaandam', 'schiedam', 'hoofddorp',
  'ede', 'gouda', 'hoorn', 'vlaardingen', 'alphen_aan_den_rijn',
  'spijkenisse', 'almelo', 'assen', 'veenendaal', 'capelle_aan_den_ijssel',
  'roosendaal', 'nieuwegein', 'heerhugowaard', 'oss', 'emmen',
  'rijswijk', 'zeist', 'bergen_op_zoom', 'dronten', 'terschelling'
);

ALTER TABLE profiles ALTER COLUMN preferred_city TYPE city_enum USING preferred_city::city_enum;
ALTER TABLE rooms ALTER COLUMN city TYPE city_enum USING city::city_enum;

-- ============================================================================
-- 2. Create vereniging_enum
-- ============================================================================
CREATE TYPE vereniging_enum AS ENUM (
  'omnivas',
  'endzjin_sveia', 'sv_bazinga',
  'asc_avsv', 'asv_gay', 'aegee_amsterdam', 'sib_amsterdam', 'sa_comitas',
  'sv_cyclades', 'odd_selene', 'derm', 'lanx', 'sv_liber', 'svaa_nonomes',
  'particolarte', 'ssra', 'unitas_sa',
  'arboricultura', 'sv_creas', 'sv_campuscafe_lokaal_99', 'quercus', 'trolleystam',
  'sv_maximus', 'sv_phileas_fogg', 'sv_virgo',
  'aegee_delft', 'aldgillis', 'delftsch_studenten_corps', 'delftsche_studenten_bond',
  'delftsche_zwervers', 'dsv_nieuwe_delft', 'dsv_sint_jansbrug', 'outsite',
  'ksv_sanctus_virgilius', 'mv_wolbodo', 'moeder_delftsche', 'ojv_de_koornbeurs',
  'sv_hezarfen', 'sv_nova', 'uknighted', 'vsstd',
  'nescio', 'pro_deo',
  'usra',
  'aegee_eindhoven', 'atmos', 'br_beurs', 'cosmos', 'compass', 'esv_demos',
  'estv_doppio', 'eindhovens_studenten_corps', 'jces_kinjin', 'sa_salaam',
  'ssre', 'tuna_ciudad_de_luz', 'ledstam',
  'audentis_et_virtutis', 'asv_taste', 'aegee_enschede', 'csv_alpha_enschede', 'radix',
  'hsv', 'intac', 'la_confrerie',
  'aegee_groningen', 'albertus_magnus', 'ffj_bernlef', 'cavv', 'cleopatra',
  'asv_dizkartes', 'flanor', 'csg_gica', 'ganymedes', 'gsv_groningen',
  'csv_ichthus_groningen', 'martinistam', 'unitas_sg', 'sib_groningen', 'vindicat',
  'carpe_noctem', 'haerlems_studenten_gildt',
  'volupia', 'woord_en_daad',
  'animoso', 'gremio_unio',
  'io_vivat', 'osiris', 'asvl_sempiternus', 'wolweze', 'luwt_stam',
  'augustinus', 'catena', 'minerva', 'quintus', 'ssr_leiden', 'aegee_leiden',
  'dac', 'sib_leiden', 'het_duivelsei', 'asv_prometheus', 'sleutelstam', 'gnsv_leiden',
  'amphitryon', 'circumflex', 'sv_koko', 'tragos',
  'aegee_nijmegen', 'nsv_carolus_magnus', 'asv_karpe_noktem', 'noviomagustam',
  'nsba', 'nsv_ovum_novum', 'sv_sturad', 'vsa_nijmegen', 'gnsv_nijmegen',
  'rsc_rvsv', 'rsv_sanctus_laurentius', 'ssr_rotterdam', 'rsg', 'nsr', 'vgsr',
  'wbs',
  'tsv_plato', 'sint_olof', 'totus',
  'biton', 'sib_utrecht', 'ssr_nu', 'uhsv_anteros', 'umtc', 'unitas_srt',
  'utrechtsch_studenten_corps', 'uvsv_nvvsu', 'veritas', 'ufo_stam', 'gnsv_utrecht',
  'aqua_ad_vinum', 'marum_bibio',
  'brabants_studenten_gilde', 'wsv_ceres', 'franciscus_xaverius', 't_noaberschop',
  'dlv_nji_sri', 'ssr_w', 'unitas_wageningen', 'wsg_paragon', 'yggdrasilstam',
  'zsv',
  'gumbo_millennium', 'oikos_nomos', 'zhtc',
  'anders'
);

-- ============================================================================
-- 3. Migrate profiles.vereniging TEXT → vereniging_enum
-- ============================================================================
ALTER TABLE profiles ADD COLUMN vereniging_new vereniging_enum;

-- Migrate known values; anything unknown becomes 'anders'
UPDATE profiles
SET vereniging_new = CASE
  WHEN vereniging IS NULL THEN NULL
  WHEN vereniging::TEXT IN (SELECT unnest(enum_range(NULL::vereniging_enum))::TEXT) THEN vereniging::vereniging_enum
  ELSE 'anders'::vereniging_enum
END;

ALTER TABLE profiles DROP COLUMN vereniging;
ALTER TABLE profiles RENAME COLUMN vereniging_new TO vereniging;

-- ============================================================================
-- 4. Migrate rooms.room_vereniging TEXT → vereniging_enum, drop is_verenigingshuis
-- ============================================================================
ALTER TABLE rooms ADD COLUMN room_vereniging_new vereniging_enum;

UPDATE rooms
SET room_vereniging_new = CASE
  WHEN room_vereniging IS NULL THEN NULL
  WHEN room_vereniging::TEXT IN (SELECT unnest(enum_range(NULL::vereniging_enum))::TEXT) THEN room_vereniging::vereniging_enum
  ELSE 'anders'::vereniging_enum
END;

ALTER TABLE rooms DROP COLUMN room_vereniging;
ALTER TABLE rooms RENAME COLUMN room_vereniging_new TO room_vereniging;

-- Remove the is_verenigingshuis column (derived from room_vereniging IS NOT NULL)
ALTER TABLE rooms DROP COLUMN is_verenigingshuis;

-- Drop the old TEXT CHECK constraint (if any survived)
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_room_vereniging_check;

-- ============================================================================
-- 5. Recreate RLS policy — use room_vereiniging IS NULL instead of is_vereinigingshuis
-- ============================================================================
DROP POLICY rooms_select ON public.rooms;

CREATE POLICY rooms_select ON public.rooms
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (
      status = 'active'
      AND (
        room_vereniging IS NULL
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
            AND profiles.vereniging IS NOT NULL
            AND profiles.vereniging = rooms.room_vereniging
        )
      )
    )
  );

-- ============================================================================
-- 6. Indexes
-- ============================================================================
DROP INDEX IF EXISTS idx_profiles_vereniging;
DROP INDEX IF EXISTS idx_rooms_vereniging;

CREATE INDEX idx_profiles_vereniging ON profiles (id, vereniging) WHERE vereniging IS NOT NULL;
CREATE INDEX idx_rooms_vereniging ON rooms (room_vereniging) WHERE room_vereniging IS NOT NULL;
