-- Room photos table (mirrors profile_photos pattern)
CREATE TABLE room_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot >= 1 AND slot <= 10),
  url TEXT NOT NULL,
  caption TEXT CHECK (length(caption) <= 200),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, slot)
);

CREATE INDEX idx_room_photos_room ON room_photos(room_id);
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;

-- Public can see photos of active rooms; housemates can see their own room photos
CREATE POLICY "Read active room photos" ON room_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_id AND rooms.status = 'active')
    OR EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id = room_photos.room_id
      AND housemates.user_id = auth.uid()
    )
  );

CREATE POLICY "Housemates insert room photos" ON room_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id = room_photos.room_id
      AND housemates.user_id = auth.uid()
      AND housemates.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Housemates update room photos" ON room_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id = room_photos.room_id
      AND housemates.user_id = auth.uid()
      AND housemates.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Housemates delete room photos" ON room_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id = room_photos.room_id
      AND housemates.user_id = auth.uid()
      AND housemates.role IN ('owner', 'admin')
    )
  );
