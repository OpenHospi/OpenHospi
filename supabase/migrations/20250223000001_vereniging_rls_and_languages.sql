-- Vereniging exclusivity RLS + spoken languages migration

-- 1A: Expand language_enum with 11 new values
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'fr';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'es';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'it';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'pt';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'zh';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'ar';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'tr';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'pl';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'hi';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'ja';
ALTER TYPE language_enum ADD VALUE IF NOT EXISTS 'ko';

-- 1B: Convert profiles.language (single) → profiles.languages (array)
ALTER TABLE profiles DROP COLUMN language;
ALTER TABLE profiles ADD COLUMN languages language_enum[] DEFAULT '{}';

-- 1C: Add rooms.accepted_languages (empty = open to all)
ALTER TABLE rooms ADD COLUMN accepted_languages language_enum[] DEFAULT '{}';

-- 1D: Update rooms_select RLS for vereniging exclusivity
DROP POLICY rooms_select ON public.rooms;

CREATE POLICY rooms_select ON public.rooms
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (
      status = 'active'
      AND (
        is_verenigingshuis IS NOT TRUE
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
            AND profiles.vereniging IS NOT NULL
            AND profiles.vereniging = rooms.room_vereniging
        )
      )
    )
  );

-- 1E: Performance indexes for vereniging lookups
CREATE INDEX idx_profiles_vereniging ON profiles (id, vereniging) WHERE vereniging IS NOT NULL;
CREATE INDEX idx_rooms_vereniging ON rooms (is_verenigingshuis, room_vereniging) WHERE is_verenigingshuis = true;
