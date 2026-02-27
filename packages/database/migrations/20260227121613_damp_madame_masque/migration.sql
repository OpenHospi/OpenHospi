CREATE TYPE "admin_action_enum" AS ENUM('view_report', 'suspend_user', 'unsuspend_user', 'remove_listing', 'remove_message', 'dismiss_report');--> statement-breakpoint
CREATE TYPE "affiliation_enum" AS ENUM('student', 'employee', 'staff');--> statement-breakpoint
CREATE TYPE "application_status_enum" AS ENUM('sent', 'seen', 'liked', 'maybe', 'rejected', 'invited', 'attending', 'not_attending', 'accepted', 'not_chosen', 'withdrawn');--> statement-breakpoint
CREATE TYPE "city_enum" AS ENUM('amsterdam', 'rotterdam', 'den_haag', 'utrecht', 'groningen', 'eindhoven', 'tilburg', 'nijmegen', 'enschede', 'arnhem', 'leiden', 'maastricht', 'delft', 'breda', 'leeuwarden', 'zwolle', 'den_bosch', 'haarlem', 'wageningen', 'middelburg', 'vlissingen', 'deventer', 'apeldoorn', 'amersfoort', 'almere', 'dordrecht', 'heerlen', 'sittard', 'venlo', 'helmond', 'zoetermeer', 'amstelveen', 'alkmaar', 'hilversum', 'lelystad', 'purmerend', 'hengelo', 'zaandam', 'schiedam', 'hoofddorp', 'ede', 'gouda', 'hoorn', 'vlaardingen', 'alphen_aan_den_rijn', 'spijkenisse', 'almelo', 'assen', 'veenendaal', 'capelle_aan_den_ijssel', 'roosendaal', 'nieuwegein', 'heerhugowaard', 'oss', 'emmen', 'rijswijk', 'zeist', 'bergen_op_zoom', 'dronten', 'terschelling');--> statement-breakpoint
CREATE TYPE "conversation_type_enum" AS ENUM('direct', 'house');--> statement-breakpoint
CREATE TYPE "delivery_status_enum" AS ENUM('sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "furnishing_enum" AS ENUM('kaal', 'gestoffeerd', 'gemeubileerd');--> statement-breakpoint
CREATE TYPE "gender_enum" AS ENUM('man', 'vrouw', 'zeg_ik_liever_niet');--> statement-breakpoint
CREATE TYPE "gender_preference_enum" AS ENUM('man', 'vrouw', 'geen_voorkeur');--> statement-breakpoint
CREATE TYPE "house_member_role_enum" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "house_type_enum" AS ENUM('studentenhuis', 'appartement', 'studio', 'woongroep', 'anti_kraak');--> statement-breakpoint
CREATE TYPE "invitation_status_enum" AS ENUM('pending', 'attending', 'not_attending', 'maybe');--> statement-breakpoint
CREATE TYPE "language_enum" AS ENUM('nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ar', 'tr', 'pl', 'hi', 'ja', 'ko');--> statement-breakpoint
CREATE TYPE "lifestyle_tag_enum" AS ENUM('gezellig', 'rustig', 'introvert', 'extravert', 'sporten', 'koken', 'gamen', 'muziek', 'uitgaan', 'feesten', 'studeren', 'lezen', 'reizen', 'filmavond', 'creatief', 'vroege_vogel', 'nachtbraker', 'schoon', 'relaxed_met_schoonmaken', 'vegetarisch', 'vegan', 'duurzaam', 'inclusief', 'internationaal', 'huisdieren');--> statement-breakpoint
CREATE TYPE "locale_enum" AS ENUM('nl', 'en', 'de');--> statement-breakpoint
CREATE TYPE "location_tag_enum" AS ENUM('dichtbij_universiteit', 'dichtbij_station', 'dichtbij_ov', 'dichtbij_centrum', 'dichtbij_supermarkt', 'dichtbij_uitgaan', 'dichtbij_sportcentrum', 'dichtbij_park', 'rustige_buurt', 'levendige_buurt');--> statement-breakpoint
CREATE TYPE "message_type_enum" AS ENUM('text', 'system');--> statement-breakpoint
CREATE TYPE "rental_type_enum" AS ENUM('vast', 'onderhuur', 'tijdelijk');--> statement-breakpoint
CREATE TYPE "report_reason_enum" AS ENUM('spam', 'harassment', 'fake_profile', 'inappropriate_content', 'scam', 'discrimination', 'other');--> statement-breakpoint
CREATE TYPE "report_status_enum" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "review_decision_enum" AS ENUM('like', 'maybe', 'reject');--> statement-breakpoint
CREATE TYPE "room_feature_enum" AS ENUM('eigen_badkamer', 'gedeelde_badkamer', 'eigen_keuken', 'gedeelde_keuken', 'balkon', 'tuin', 'terras', 'berging', 'parkeerplaats', 'fietsenstalling', 'wasmachine', 'droger', 'vaatwasser', 'wifi_inbegrepen', 'huisdieren_toegestaan', 'roken_toegestaan', 'geen_huisdieren', 'niet_roken');--> statement-breakpoint
CREATE TYPE "room_status_enum" AS ENUM('draft', 'active', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "study_level_enum" AS ENUM('mbo', 'hbo_propedeuse', 'hbo_bachelor', 'wo_propedeuse', 'wo_bachelor', 'pre_master', 'master', 'phd');--> statement-breakpoint
CREATE TYPE "vereniging_enum" AS ENUM('omnivas', 'endzjin_sveia', 'sv_bazinga', 'asc_avsv', 'asv_gay', 'aegee_amsterdam', 'sib_amsterdam', 'sa_comitas', 'sv_cyclades', 'odd_selene', 'derm', 'lanx', 'sv_liber', 'svaa_nonomes', 'particolarte', 'ssra', 'unitas_sa', 'arboricultura', 'sv_creas', 'sv_campuscafe_lokaal_99', 'quercus', 'trolleystam', 'sv_maximus', 'sv_phileas_fogg', 'sv_virgo', 'aegee_delft', 'aldgillis', 'delftsch_studenten_corps', 'delftsche_studenten_bond', 'delftsche_zwervers', 'dsv_nieuwe_delft', 'dsv_sint_jansbrug', 'outsite', 'ksv_sanctus_virgilius', 'mv_wolbodo', 'moeder_delftsche', 'ojv_de_koornbeurs', 'sv_hezarfen', 'sv_nova', 'uknighted', 'vsstd', 'nescio', 'pro_deo', 'usra', 'aegee_eindhoven', 'atmos', 'br_beurs', 'cosmos', 'compass', 'esv_demos', 'estv_doppio', 'eindhovens_studenten_corps', 'jces_kinjin', 'sa_salaam', 'ssre', 'tuna_ciudad_de_luz', 'ledstam', 'audentis_et_virtutis', 'asv_taste', 'aegee_enschede', 'csv_alpha_enschede', 'radix', 'hsv', 'intac', 'la_confrerie', 'aegee_groningen', 'albertus_magnus', 'ffj_bernlef', 'cavv', 'cleopatra', 'asv_dizkartes', 'flanor', 'csg_gica', 'ganymedes', 'gsv_groningen', 'csv_ichthus_groningen', 'martinistam', 'unitas_sg', 'sib_groningen', 'vindicat', 'carpe_noctem', 'haerlems_studenten_gildt', 'volupia', 'woord_en_daad', 'animoso', 'gremio_unio', 'io_vivat', 'osiris', 'asvl_sempiternus', 'wolweze', 'luwt_stam', 'augustinus', 'catena', 'minerva', 'quintus', 'ssr_leiden', 'aegee_leiden', 'dac', 'sib_leiden', 'het_duivelsei', 'asv_prometheus', 'sleutelstam', 'gnsv_leiden', 'amphitryon', 'circumflex', 'sv_koko', 'tragos', 'aegee_nijmegen', 'nsv_carolus_magnus', 'asv_karpe_noktem', 'noviomagustam', 'nsba', 'nsv_ovum_novum', 'sv_sturad', 'vsa_nijmegen', 'gnsv_nijmegen', 'rsc_rvsv', 'rsv_sanctus_laurentius', 'ssr_rotterdam', 'rsg', 'nsr', 'vgsr', 'wbs', 'tsv_plato', 'sint_olof', 'totus', 'biton', 'sib_utrecht', 'ssr_nu', 'uhsv_anteros', 'umtc', 'unitas_srt', 'utrechtsch_studenten_corps', 'uvsv_nvvsu', 'veritas', 'ufo_stam', 'gnsv_utrecht', 'aqua_ad_vinum', 'marum_bibio', 'brabants_studenten_gilde', 'wsv_ceres', 'franciscus_xaverius', 't_noaberschop', 'dlv_nji_sri', 'ssr_w', 'unitas_wageningen', 'wsg_paragon', 'yggdrasilstam', 'zsv', 'gumbo_millennium', 'oikos_nomos', 'zhtc', 'anders');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "sso_provider" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"issuer" text NOT NULL,
	"oidc_config" text,
	"saml_config" text,
	"user_id" uuid,
	"provider_id" text NOT NULL UNIQUE,
	"organization_id" text,
	"domain" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"slot" smallint NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profile_photos_user_id_slot_key" UNIQUE("user_id","slot")
);
--> statement-breakpoint
ALTER TABLE "profile_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"institution_domain" text NOT NULL,
	"affiliation" "affiliation_enum" DEFAULT 'student'::"affiliation_enum",
	"faculty" text,
	"avatar_url" text,
	"birth_date" date,
	"gender" "gender_enum",
	"bio" text,
	"study_program" text,
	"study_level" "study_level_enum",
	"vereniging" "vereniging_enum",
	"role" text DEFAULT 'seeker',
	"max_rent" numeric(7,2),
	"available_from" date,
	"preferred_city" "city_enum",
	"instagram_handle" text,
	"show_instagram" boolean DEFAULT false,
	"lifestyle_tags" "lifestyle_tag_enum"[] DEFAULT '{}'::"lifestyle_tag_enum"[],
	"languages" "language_enum"[] DEFAULT '{}'::"language_enum"[],
	"preferred_locale" "locale_enum" DEFAULT 'nl'::"locale_enum",
	"notification_preferences" jsonb,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "house_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"house_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "house_member_role_enum" DEFAULT 'member'::"house_member_role_enum" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "house_members_house_id_user_id_key" UNIQUE("house_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "house_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "houses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"invite_code" uuid DEFAULT gen_random_uuid() UNIQUE,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "houses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "room_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"slot" smallint NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "room_photos_room_id_slot_key" UNIQUE("room_id","slot")
);
--> statement-breakpoint
ALTER TABLE "room_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_by" uuid NOT NULL,
	"house_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"city" "city_enum" NOT NULL,
	"neighborhood" text,
	"address" text,
	"rent_price" numeric(7,2) DEFAULT '0' NOT NULL,
	"deposit" numeric(7,2),
	"utilities_included" boolean DEFAULT false,
	"service_costs" numeric(7,2),
	"total_cost" numeric(7,2) GENERATED ALWAYS AS (rent_price + COALESCE(service_costs, 0)) STORED,
	"room_size_m2" integer,
	"available_from" date,
	"available_until" date,
	"rental_type" "rental_type_enum" DEFAULT 'vast'::"rental_type_enum",
	"house_type" "house_type_enum",
	"furnishing" "furnishing_enum",
	"total_housemates" integer,
	"features" "room_feature_enum"[] DEFAULT '{}'::"room_feature_enum"[],
	"location_tags" "location_tag_enum"[] DEFAULT '{}'::"location_tag_enum"[],
	"room_vereniging" "vereniging_enum",
	"preferred_gender" "gender_preference_enum" DEFAULT 'geen_voorkeur'::"gender_preference_enum",
	"preferred_age_min" integer,
	"preferred_age_max" integer,
	"preferred_lifestyle_tags" "lifestyle_tag_enum"[] DEFAULT '{}'::"lifestyle_tag_enum"[],
	"status" "room_status_enum" DEFAULT 'draft'::"room_status_enum" NOT NULL,
	"share_link" uuid DEFAULT gen_random_uuid() UNIQUE,
	"share_link_expires_at" timestamp with time zone,
	"share_link_max_uses" integer,
	"share_link_use_count" integer DEFAULT 0,
	"accepted_languages" "language_enum"[] DEFAULT '{}'::"language_enum"[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"personal_message" text,
	"status" "application_status_enum" DEFAULT 'sent'::"application_status_enum" NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_room_id_user_id_key" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"decision" "review_decision_enum" NOT NULL,
	"notes" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_room_id_reviewer_id_applicant_id_key" UNIQUE("room_id","reviewer_id","applicant_id")
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hospi_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"time_start" time NOT NULL,
	"time_end" time,
	"location" text,
	"rsvp_deadline" timestamp with time zone,
	"max_attendees" integer,
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hospi_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hospi_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"status" "invitation_status_enum" DEFAULT 'pending'::"invitation_status_enum",
	"responded_at" timestamp with time zone,
	"decline_reason" text,
	"reminder_sent_at" timestamp with time zone,
	"invited_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "hospi_invitations_event_id_user_id_key" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "hospi_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_room_id_voter_id_applicant_id_round_key" UNIQUE("room_id","voter_id","applicant_id","round")
);
--> statement-breakpoint
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversation_members" (
	"conversation_id" uuid,
	"user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now(),
	"muted" boolean DEFAULT false,
	CONSTRAINT "conversation_members_pkey" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid,
	"seeker_user_id" uuid,
	"type" "conversation_type_enum" DEFAULT 'direct'::"conversation_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_room_id_seeker_user_id_key" UNIQUE("room_id","seeker_user_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_receipts" (
	"message_id" uuid,
	"user_id" uuid,
	"status" "delivery_status_enum" DEFAULT 'sent'::"delivery_status_enum" NOT NULL,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	CONSTRAINT "message_receipts_pkey" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "message_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"encrypted_keys" jsonb,
	"message_type" "message_type_enum" DEFAULT 'text'::"message_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" uuid,
	"blocked_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_pkey" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "private_key_backups" (
	"user_id" uuid PRIMARY KEY,
	"encrypted_private_key" text NOT NULL,
	"backup_iv" text NOT NULL,
	"backup_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private_key_backups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_keys" (
	"user_id" uuid PRIMARY KEY,
	"public_key_jwk" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "public_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid,
	"reported_room_id" uuid,
	"reported_message_id" uuid,
	"reason" "report_reason_enum" NOT NULL,
	"description" text,
	"decrypted_message_text" text,
	"status" "report_status_enum" DEFAULT 'pending'::"report_status_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"admin_user_id" uuid NOT NULL,
	"action" "admin_action_enum" NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"reason" text NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}',
	"sent" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"expo_push_token" text NOT NULL,
	"device_type" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_user_id_expo_push_token_key" UNIQUE("user_id","expo_push_token")
);
--> statement-breakpoint
ALTER TABLE "push_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "idx_profile_photos_user" ON "profile_photos" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_vereniging" ON "profiles" ("id","vereniging") WHERE ("vereniging" is not null);--> statement-breakpoint
CREATE INDEX "idx_house_members_user_id" ON "house_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_house_members_house_id" ON "house_members" ("house_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_city_status" ON "rooms" ("city","status");--> statement-breakpoint
CREATE INDEX "idx_rooms_rent_price" ON "rooms" ("rent_price");--> statement-breakpoint
CREATE INDEX "idx_rooms_available_from" ON "rooms" ("available_from");--> statement-breakpoint
CREATE INDEX "idx_rooms_vereniging" ON "rooms" ("room_vereniging") WHERE ("room_vereniging" is not null);--> statement-breakpoint
CREATE INDEX "idx_applications_user_id" ON "applications" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_applications_room_id_status" ON "applications" ("room_id","status");--> statement-breakpoint
CREATE INDEX "idx_hospi_invitations_event_id" ON "hospi_invitations" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_hospi_invitations_user_id" ON "hospi_invitations" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_members_user_id" ON "conversation_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_created" ON "messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_blocks_blocked_id" ON "blocks" ("blocked_id");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_push_tokens_user_id" ON "push_tokens" ("user_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "room_photos" ADD CONSTRAINT "room_photos_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_applicant_id_profiles_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "hospi_events" ADD CONSTRAINT "hospi_events_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_events" ADD CONSTRAINT "hospi_events_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_event_id_hospi_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "hospi_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_application_id_applications_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_profiles_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_applicant_id_profiles_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seeker_user_id_profiles_id_fkey" FOREIGN KEY ("seeker_user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_message_id_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_profiles_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_profiles_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "private_key_backups" ADD CONSTRAINT "private_key_backups_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "public_keys" ADD CONSTRAINT "public_keys_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_profiles_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_room_id_rooms_id_fkey" FOREIGN KEY ("reported_room_id") REFERENCES "rooms"("id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_message_id_messages_id_fkey" FOREIGN KEY ("reported_message_id") REFERENCES "messages"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "conversation_members_rls" AS (select "conversation_id", "user_id" from "conversation_members");--> statement-breakpoint
CREATE VIEW "house_members_rls" AS (select "house_id", "user_id", "role" from "house_members");--> statement-breakpoint
CREATE VIEW "room_members_rls" AS (select "rooms"."id", "house_members"."user_id", "house_members"."role" from "house_members" inner join "rooms" on "rooms"."house_id" = "house_members"."house_id");--> statement-breakpoint
CREATE POLICY "profile_photos_select" ON "profile_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profile_photos_insert" ON "profile_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("profile_photos"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profile_photos_update" ON "profile_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profile_photos"."user_id" = (select auth.uid())) WITH CHECK ("profile_photos"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profile_photos_delete" ON "profile_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("profile_photos"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_select" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "house_members_select" ON "house_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from house_members_rls where house_members_rls.house_id = "house_members"."house_id" and house_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "house_members_insert" ON "house_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from houses where houses.id = "house_members"."house_id" and houses.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "house_members_delete" ON "house_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from houses where houses.id = "house_members"."house_id" and houses.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "houses_select" ON "houses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("houses"."created_by" = (select auth.uid()) or exists(select 1 from house_members_rls where house_members_rls.house_id = "houses"."id" and house_members_rls.user_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "houses_insert" ON "houses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("houses"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "houses_update" ON "houses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("houses"."created_by" = (select auth.uid())) WITH CHECK ("houses"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "room_photos_select_anon" ON "room_photos" AS PERMISSIVE FOR SELECT TO "anon" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.status = 'active'));--> statement-breakpoint
CREATE POLICY "room_photos_select" ON "room_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "room_photos_insert" ON "room_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "room_photos_update" ON "room_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid()))) WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "room_photos_delete" ON "room_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "rooms_select_anon" ON "rooms" AS PERMISSIVE FOR SELECT TO "anon" USING ("rooms"."status" = 'active');--> statement-breakpoint
CREATE POLICY "rooms_select_auth" ON "rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("rooms"."status" = 'active' or "rooms"."created_by" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "rooms_insert_own" ON "rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "rooms_update_own" ON "rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("rooms"."created_by" = (select auth.uid())) WITH CHECK ("rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "applications_select" ON "applications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "applications_insert" ON "applications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("applications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "applications_update" ON "applications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.uid()) and room_members_rls.role = 'owner'));--> statement-breakpoint
CREATE POLICY "reviews_select" ON "reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reviews_insert" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reviews"."reviewer_id" = (select auth.uid()) and exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reviews_update" ON "reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("reviews"."reviewer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "hospi_events_select" ON "hospi_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "hospi_events"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "hospi_events_insert" ON "hospi_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("hospi_events"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "hospi_events_update" ON "hospi_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("hospi_events"."created_by" = (select auth.uid())) WITH CHECK ("hospi_events"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "hospi_events_delete" ON "hospi_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("hospi_events"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "hospi_invitations_select" ON "hospi_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.uid()) or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "hospi_invitations_insert" ON "hospi_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "hospi_invitations_update" ON "hospi_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.uid()) or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "hospi_invitations_delete" ON "hospi_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_select" ON "votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "votes"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_insert" ON "votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("votes"."voter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "votes_update" ON "votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("votes"."voter_id" = (select auth.uid())) WITH CHECK ("votes"."voter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "votes_delete" ON "votes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("votes"."voter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "conversation_members_select" ON "conversation_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "conversation_members"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "conversation_members_insert" ON "conversation_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("conversation_members"."user_id" = (select auth.uid()) or exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "conversation_members"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "conversation_members_update" ON "conversation_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("conversation_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "conversation_members_delete" ON "conversation_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("conversation_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "conversations_select" ON "conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "conversations"."id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "conversations_insert" ON "conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "message_receipts_select" ON "message_receipts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_insert" ON "message_receipts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_update" ON "message_receipts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("message_receipts"."user_id" = (select auth.uid())) WITH CHECK ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_delete" ON "message_receipts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_select" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "messages"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "messages_insert" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("messages"."sender_id" = (select auth.uid()) and exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "messages"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "messages_update" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("messages"."sender_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "messages_delete" ON "messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("messages"."sender_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_update" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid())) WITH CHECK ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_select" ON "private_key_backups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_insert" ON "private_key_backups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_update" ON "private_key_backups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid())) WITH CHECK ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_delete" ON "private_key_backups" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "public_keys_select" ON "public_keys" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "public_keys_insert" ON "public_keys" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("public_keys"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "public_keys_update" ON "public_keys" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("public_keys"."user_id" = (select auth.uid())) WITH CHECK ("public_keys"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "public_keys_delete" ON "public_keys" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("public_keys"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_insert_own" ON "reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reports"."reporter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_select_own" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("reports"."reporter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = (select auth.uid())) WITH CHECK ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_select" ON "push_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_insert" ON "push_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_update" ON "push_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid())) WITH CHECK ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_delete" ON "push_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid()));