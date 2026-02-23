-- ============================================
-- ENUMS — Single source of truth for all options
-- Every enum maps 1:1 to a translation key: enums.{enum_name}.{value}
-- ============================================

-- Profile enums
CREATE TYPE gender_enum AS ENUM (
  'man', 'vrouw', 'zeg_ik_liever_niet'
);
CREATE TYPE gender_preference_enum AS ENUM (
  'man', 'vrouw', 'geen_voorkeur'
);
CREATE TYPE language_enum AS ENUM ('nl', 'en', 'de');
CREATE TYPE affiliation_enum AS ENUM ('student', 'employee', 'staff');

CREATE TYPE lifestyle_tag_enum AS ENUM (
  'gezellig', 'rustig', 'introvert', 'extravert',
  'sporten', 'koken', 'gamen', 'muziek', 'uitgaan', 'feesten',
  'studeren', 'lezen', 'reizen', 'filmavond', 'creatief',
  'vroege_vogel', 'nachtbraker',
  'schoon', 'relaxed_met_schoonmaken',
  'vegetarisch', 'vegan', 'duurzaam',
  'inclusief', 'internationaal', 'huisdieren'
);

-- Room enums
CREATE TYPE house_type_enum AS ENUM (
  'studentenhuis', 'appartement', 'studio', 'woongroep', 'anti_kraak'
);
CREATE TYPE room_status_enum AS ENUM ('draft', 'active', 'paused', 'closed');
CREATE TYPE furnishing_enum AS ENUM (
  'kaal', 'gestoffeerd', 'gemeubileerd'
);

CREATE TYPE room_feature_enum AS ENUM (
  'eigen_badkamer', 'gedeelde_badkamer', 'eigen_keuken', 'gedeelde_keuken',
  'balkon', 'tuin', 'terras',
  'berging', 'parkeerplaats', 'fietsenstalling',
  'wasmachine', 'droger', 'vaatwasser',
  'wifi_inbegrepen',
  'huisdieren_toegestaan', 'roken_toegestaan', 'geen_huisdieren', 'niet_roken'
);

CREATE TYPE rental_type_enum AS ENUM (
  'vast', 'onderhuur', 'tijdelijk'
);

CREATE TYPE location_tag_enum AS ENUM (
  'dichtbij_universiteit', 'dichtbij_station', 'dichtbij_ov',
  'dichtbij_centrum', 'dichtbij_supermarkt', 'dichtbij_uitgaan',
  'dichtbij_sportcentrum', 'dichtbij_park',
  'rustige_buurt', 'levendige_buurt'
);

CREATE TYPE city_enum AS ENUM (
  'amsterdam', 'rotterdam', 'den_haag', 'utrecht', 'groningen',
  'eindhoven', 'tilburg', 'nijmegen', 'enschede', 'arnhem',
  'leiden', 'maastricht', 'delft', 'breda', 'leeuwarden',
  'zwolle', 'den_bosch', 'haarlem', 'wageningen', 'middelburg',
  'vlissingen', 'deventer', 'apeldoorn', 'amersfoort', 'almere',
  'dordrecht', 'heerlen', 'sittard', 'venlo', 'helmond',
  'anders'
);

-- Application & review enums
CREATE TYPE application_status_enum AS ENUM (
  'sent', 'seen', 'liked', 'maybe', 'rejected',
  'invited', 'attending', 'not_attending',
  'accepted', 'not_chosen', 'withdrawn'
);
CREATE TYPE review_decision_enum AS ENUM ('like', 'maybe', 'reject');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'attending', 'not_attending', 'maybe');

-- House & chat enums
CREATE TYPE housemate_role_enum AS ENUM ('owner', 'admin', 'member');
CREATE TYPE conversation_type_enum AS ENUM ('direct', 'group', 'house');
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'system');
CREATE TYPE delivery_status_enum AS ENUM ('sent', 'delivered', 'read');

-- Admin enums
CREATE TYPE admin_action_enum AS ENUM (
  'view_report', 'suspend_user', 'unsuspend_user',
  'remove_listing', 'remove_message', 'dismiss_report'
);
CREATE TYPE report_reason_enum AS ENUM (
  'spam', 'harassment', 'fake_profile', 'inappropriate_content',
  'scam', 'discrimination', 'other'
);
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');


-- ============================================
-- TABLES
-- ============================================

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES "user"(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution_domain TEXT NOT NULL,
  affiliation affiliation_enum DEFAULT 'student',
  faculty TEXT,
  avatar_url TEXT,
  birth_date DATE,
  gender gender_enum,
  bio TEXT CHECK (length(bio) <= 1000),
  study_program TEXT CHECK (length(study_program) <= 200),
  study_year INTEGER CHECK (study_year >= 1),
  vereniging TEXT,
  role TEXT DEFAULT 'seeker' CHECK (role IN ('seeker', 'offering', 'both')),
  max_rent NUMERIC(7,2) CHECK (max_rent >= 0),
  available_from DATE,
  preferred_city city_enum,
  instagram_handle TEXT CHECK (instagram_handle ~ '^[a-zA-Z0-9._]{1,30}$'),
  show_instagram BOOLEAN DEFAULT FALSE,
  lifestyle_tags lifestyle_tag_enum[] DEFAULT '{}',
  language language_enum DEFAULT 'nl',
  notification_preferences JSONB DEFAULT '{
    "new_application": true,
    "application_status": true,
    "chat_messages": true,
    "hospi_invitations": true,
    "hospi_reminders": true,
    "marketing": false
  }' CHECK (
    notification_preferences IS NULL OR (
      jsonb_typeof(notification_preferences) = 'object'
      AND notification_preferences ?& ARRAY[
        'new_application', 'application_status', 'chat_messages',
        'hospi_invitations', 'hospi_reminders', 'marketing'
      ]
      AND jsonb_typeof(notification_preferences->'new_application') = 'boolean'
      AND jsonb_typeof(notification_preferences->'application_status') = 'boolean'
      AND jsonb_typeof(notification_preferences->'chat_messages') = 'boolean'
      AND jsonb_typeof(notification_preferences->'hospi_invitations') = 'boolean'
      AND jsonb_typeof(notification_preferences->'hospi_reminders') = 'boolean'
      AND jsonb_typeof(notification_preferences->'marketing') = 'boolean'
      AND octet_length(notification_preferences::TEXT) <= 1024
    )
  ),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT CHECK (length(description) <= 5000),
  city city_enum NOT NULL,
  neighborhood TEXT,
  address TEXT,
  rent_price NUMERIC(7,2) NOT NULL CHECK (rent_price >= 0),
  deposit NUMERIC(7,2) CHECK (deposit >= 0),
  utilities_included BOOLEAN DEFAULT FALSE,
  room_size_m2 INTEGER CHECK (room_size_m2 >= 1),
  available_from DATE,
  available_until DATE,
  rental_type rental_type_enum DEFAULT 'vast',
  house_type house_type_enum,
  furnishing furnishing_enum,
  total_housemates INTEGER CHECK (total_housemates >= 1),
  features room_feature_enum[] DEFAULT '{}',
  location_tags location_tag_enum[] DEFAULT '{}',
  is_verenigingshuis BOOLEAN DEFAULT FALSE,
  room_vereniging TEXT CHECK (length(room_vereniging) <= 100),
  photos TEXT[] DEFAULT '{}',
  preferred_gender gender_preference_enum DEFAULT 'geen_voorkeur',
  preferred_age_min INTEGER CHECK (preferred_age_min >= 16),
  preferred_age_max INTEGER CHECK (preferred_age_max >= 16),
  preferred_lifestyle_tags lifestyle_tag_enum[] DEFAULT '{}',
  status room_status_enum DEFAULT 'active',
  share_link TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  share_link_expires_at TIMESTAMPTZ,
  share_link_max_uses INTEGER,
  share_link_use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rental_type_available_until_check CHECK (
    (rental_type = 'vast' AND available_until IS NULL)
    OR (rental_type IN ('onderhuur', 'tijdelijk') AND available_until IS NOT NULL)
  )
);

-- HOUSEMATES
CREATE TABLE housemates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role housemate_role_enum DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- APPLICATIONS
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  personal_message TEXT CHECK (length(personal_message) <= 2000),
  status application_status_enum DEFAULT 'sent',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  applicant_id UUID REFERENCES profiles(id),
  decision review_decision_enum,
  notes TEXT CHECK (length(notes) <= 2000),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, reviewer_id, applicant_id)
);

-- HOSPI EVENTS
CREATE TABLE hospi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  description TEXT CHECK (length(description) <= 5000),
  event_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  location TEXT CHECK (length(location) <= 500),
  rsvp_deadline TIMESTAMPTZ,
  max_attendees INTEGER,
  notes TEXT CHECK (length(notes) <= 2000),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOSPI INVITATIONS
CREATE TABLE hospi_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES hospi_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  application_id UUID REFERENCES applications(id),
  status invitation_status_enum DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  decline_reason TEXT CHECK (length(decline_reason) <= 500),
  reminder_sent_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- VOTES
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  applicant_id UUID REFERENCES profiles(id),
  rank INTEGER CHECK (rank BETWEEN 1 AND 5),
  round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, voter_id, applicant_id, round)
);

-- CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  type conversation_type_enum DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSATION MEMBERS
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  message_type message_type_enum DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGE RECEIPTS
CREATE TABLE message_receipts (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  status delivery_status_enum DEFAULT 'sent',
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  PRIMARY KEY (message_id, user_id)
);

-- PUBLIC KEYS (E2EE)
CREATE TABLE public_keys (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  public_key_jwk JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ
);

-- PRIVATE KEY BACKUPS (E2EE)
CREATE TABLE private_key_backups (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  encrypted_private_key TEXT NOT NULL,
  backup_iv TEXT NOT NULL,
  backup_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS & MODERATION
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  reported_user_id UUID REFERENCES profiles(id),
  reported_room_id UUID REFERENCES rooms(id),
  reported_message_id UUID REFERENCES messages(id),
  reason report_reason_enum NOT NULL,
  description TEXT CHECK (length(description) <= 2000),
  decrypted_message_text TEXT CHECK (length(decrypted_message_text) <= 5000),
  status report_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- BLOCKS
CREATE TABLE blocks (
  blocker_id UUID REFERENCES profiles(id) NOT NULL,
  blocked_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- PUSH TOKENS
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN AUDIT LOG
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action admin_action_enum NOT NULL,
  target_type TEXT,
  target_id UUID,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE housemates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospi_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_key_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;


-- ============================================
-- STORAGE BUCKETS + POLICIES
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', TRUE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-photos', 'room-photos', TRUE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Housemates upload room photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'room-photos'
    AND EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id::TEXT = (storage.foldername(name))[1]
      AND housemates.user_id = auth.uid()
    )
  );

CREATE POLICY "Public room photo access" ON storage.objects
  FOR SELECT USING (bucket_id = 'room-photos');

CREATE POLICY "Housemates delete room photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'room-photos'
    AND EXISTS (
      SELECT 1 FROM housemates
      WHERE housemates.room_id::TEXT = (storage.foldername(name))[1]
      AND housemates.user_id = auth.uid()
    )
  );


-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_rooms_city_status ON rooms (city, status);
CREATE INDEX idx_rooms_rent_price ON rooms (rent_price);
CREATE INDEX idx_rooms_available_from ON rooms (available_from);
CREATE INDEX idx_applications_user_id ON applications (user_id);
CREATE INDEX idx_applications_room_id_status ON applications (room_id, status);
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_conversation_members_user_id ON conversation_members (user_id);
CREATE INDEX idx_housemates_user_id ON housemates (user_id);
CREATE INDEX idx_housemates_room_id ON housemates (room_id);
CREATE INDEX idx_hospi_invitations_event_id ON hospi_invitations (event_id);
CREATE INDEX idx_hospi_invitations_user_id ON hospi_invitations (user_id);
CREATE INDEX idx_blocks_blocked_id ON blocks (blocked_id);
CREATE INDEX idx_notifications_user_id ON notifications (user_id, created_at DESC);
CREATE INDEX idx_push_tokens_user_id ON push_tokens (user_id);
CREATE INDEX idx_reports_status ON reports (status);


-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_rooms
  BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_hospi_events
  BEFORE UPDATE ON hospi_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_push_tokens
  BEFORE UPDATE ON push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
