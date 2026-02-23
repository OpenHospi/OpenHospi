-- Profile photos table (5 prompted slots per user)
-- Same column pattern as room_photos (Step 3) for shared TypeScript code
CREATE TABLE profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot >= 1 AND slot <= 5),
  url TEXT NOT NULL,
  caption TEXT CHECK (length(caption) <= 200),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, slot)
);

CREATE INDEX idx_profile_photos_user ON profile_photos(user_id);

ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own photos" ON profile_photos
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Public read photos" ON profile_photos
  FOR SELECT USING (TRUE);
CREATE POLICY "Users insert own photos" ON profile_photos
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own photos" ON profile_photos
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own photos" ON profile_photos
  FOR DELETE USING (user_id = auth.uid());

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 'profile-photos', TRUE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Users upload own profile photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "Public profile photo access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Users delete own profile photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
