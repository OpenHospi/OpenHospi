CREATE TYPE "admin_action_enum" AS ENUM('view_report', 'update_report', 'suspend_user', 'unsuspend_user', 'remove_listing', 'remove_message', 'dismiss_report', 'process_data_request', 'lift_restriction', 'export_user_data', 'view_user_data');--> statement-breakpoint
CREATE TYPE "application_status_enum" AS ENUM('sent', 'seen', 'liked', 'maybe', 'rejected', 'hospi', 'accepted', 'not_chosen', 'withdrawn');--> statement-breakpoint
CREATE TYPE "city_enum" AS ENUM('amsterdam', 'rotterdam', 'den_haag', 'utrecht', 'groningen', 'eindhoven', 'tilburg', 'nijmegen', 'enschede', 'arnhem', 'leiden', 'maastricht', 'delft', 'breda', 'leeuwarden', 'zwolle', 'den_bosch', 'haarlem', 'wageningen', 'middelburg', 'vlissingen', 'deventer', 'apeldoorn', 'amersfoort', 'almere', 'dordrecht', 'heerlen', 'sittard', 'venlo', 'helmond', 'zoetermeer', 'amstelveen', 'alkmaar', 'hilversum', 'lelystad', 'purmerend', 'hengelo', 'zaandam', 'schiedam', 'hoofddorp', 'ede', 'gouda', 'hoorn', 'vlaardingen', 'alphen_aan_den_rijn', 'spijkenisse', 'almelo', 'assen', 'veenendaal', 'capelle_aan_den_ijssel', 'roosendaal', 'nieuwegein', 'heerhugowaard', 'oss', 'emmen', 'rijswijk', 'zeist', 'bergen_op_zoom', 'dronten', 'terschelling');--> statement-breakpoint
CREATE TYPE "consent_purpose_enum" AS ENUM('essential', 'functional', 'push_notifications', 'analytics');--> statement-breakpoint
CREATE TYPE "data_request_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'denied');--> statement-breakpoint
CREATE TYPE "data_request_type_enum" AS ENUM('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection');--> statement-breakpoint
CREATE TYPE "delivery_status_enum" AS ENUM('sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "discover_sort_enum" AS ENUM('newest', 'cheapest', 'most_expensive');--> statement-breakpoint
CREATE TYPE "furnishing_enum" AS ENUM('unfurnished', 'semi_furnished', 'furnished');--> statement-breakpoint
CREATE TYPE "gender_enum" AS ENUM('male', 'female', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "gender_preference_enum" AS ENUM('male', 'female', 'no_preference');--> statement-breakpoint
CREATE TYPE "house_member_role_enum" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "house_type_enum" AS ENUM('student_house', 'apartment', 'studio', 'living_group', 'anti_squat');--> statement-breakpoint
CREATE TYPE "invitation_status_enum" AS ENUM('pending', 'attending', 'not_attending', 'maybe');--> statement-breakpoint
CREATE TYPE "language_enum" AS ENUM('nl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ar', 'tr', 'pl', 'hi', 'ja', 'ko');--> statement-breakpoint
CREATE TYPE "legal_basis_enum" AS ENUM('consent', 'contract', 'legal_obligation', 'legitimate_interest');--> statement-breakpoint
CREATE TYPE "lifestyle_tag_enum" AS ENUM('sociable', 'quiet', 'introvert', 'extrovert', 'sports', 'cooking', 'gaming', 'music', 'nightlife', 'partying', 'studying', 'reading', 'traveling', 'movie_night', 'creative', 'early_bird', 'night_owl', 'tidy', 'relaxed_cleaning', 'vegetarian', 'vegan', 'sustainable', 'inclusive', 'international', 'pets');--> statement-breakpoint
CREATE TYPE "locale_enum" AS ENUM('nl', 'en', 'de');--> statement-breakpoint
CREATE TYPE "location_tag_enum" AS ENUM('near_university', 'near_station', 'near_transit', 'near_center', 'near_supermarket', 'near_nightlife', 'near_sports_center', 'near_park', 'quiet_neighborhood', 'lively_neighborhood');--> statement-breakpoint
CREATE TYPE "message_type_enum" AS ENUM('ciphertext', 'sender_key_distribution', 'system');--> statement-breakpoint
CREATE TYPE "platform_enum" AS ENUM('web', 'ios', 'android');--> statement-breakpoint
CREATE TYPE "rental_type_enum" AS ENUM('permanent', 'sublet', 'temporary');--> statement-breakpoint
CREATE TYPE "report_reason_enum" AS ENUM('spam', 'harassment', 'fake_profile', 'inappropriate_content', 'scam', 'discrimination', 'other');--> statement-breakpoint
CREATE TYPE "report_status_enum" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "report_type_enum" AS ENUM('message', 'user', 'room');--> statement-breakpoint
CREATE TYPE "review_decision_enum" AS ENUM('like', 'maybe', 'reject');--> statement-breakpoint
CREATE TYPE "room_feature_enum" AS ENUM('private_bathroom', 'shared_bathroom', 'private_kitchen', 'shared_kitchen', 'balcony', 'garden', 'terrace', 'storage', 'parking', 'bike_storage', 'washing_machine', 'dryer', 'dishwasher', 'wifi_included', 'pets_allowed', 'smoking_allowed', 'no_pets', 'no_smoking');--> statement-breakpoint
CREATE TYPE "room_status_enum" AS ENUM('draft', 'active', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "sender_key_distribution_status_enum" AS ENUM('pending', 'delivered');--> statement-breakpoint
CREATE TYPE "study_level_enum" AS ENUM('mbo', 'hbo_propedeuse', 'hbo_bachelor', 'wo_propedeuse', 'wo_bachelor', 'pre_master', 'master', 'phd');--> statement-breakpoint
CREATE TYPE "utilities_included_enum" AS ENUM('included', 'not_included', 'estimated');--> statement-breakpoint
CREATE TYPE "vereniging_enum" AS ENUM('omnivas', 'endzjin_sveia', 'sv_bazinga', 'asc_avsv', 'asv_gay', 'aegee_amsterdam', 'sib_amsterdam', 'sa_comitas', 'sv_cyclades', 'odd_selene', 'derm', 'lanx', 'sv_liber', 'svaa_nonomes', 'particolarte', 'ssra', 'unitas_sa', 'arboricultura', 'sv_creas', 'sv_campuscafe_lokaal_99', 'quercus', 'trolleystam', 'sv_maximus', 'sv_phileas_fogg', 'sv_virgo', 'aegee_delft', 'aldgillis', 'delftsch_studenten_corps', 'delftsche_studenten_bond', 'delftsche_zwervers', 'dsv_nieuwe_delft', 'dsv_sint_jansbrug', 'outsite', 'ksv_sanctus_virgilius', 'mv_wolbodo', 'moeder_delftsche', 'ojv_de_koornbeurs', 'sv_hezarfen', 'sv_nova', 'uknighted', 'vsstd', 'nescio', 'pro_deo', 'usra', 'aegee_eindhoven', 'atmos', 'br_beurs', 'cosmos', 'compass', 'esv_demos', 'estv_doppio', 'eindhovens_studenten_corps', 'jces_kinjin', 'sa_salaam', 'ssre', 'tuna_ciudad_de_luz', 'ledstam', 'audentis_et_virtutis', 'asv_taste', 'aegee_enschede', 'csv_alpha_enschede', 'radix', 'hsv', 'intac', 'la_confrerie', 'aegee_groningen', 'albertus_magnus', 'ffj_bernlef', 'cavv', 'cleopatra', 'asv_dizkartes', 'flanor', 'csg_gica', 'ganymedes', 'gsv_groningen', 'csv_ichthus_groningen', 'martinistam', 'unitas_sg', 'sib_groningen', 'vindicat', 'carpe_noctem', 'haerlems_studenten_gildt', 'volupia', 'woord_en_daad', 'animoso', 'gremio_unio', 'io_vivat', 'osiris', 'asvl_sempiternus', 'wolweze', 'luwt_stam', 'augustinus', 'catena', 'minerva', 'quintus', 'ssr_leiden', 'aegee_leiden', 'dac', 'sib_leiden', 'het_duivelsei', 'asv_prometheus', 'sleutelstam', 'gnsv_leiden', 'amphitryon', 'circumflex', 'sv_koko', 'tragos', 'aegee_nijmegen', 'nsv_carolus_magnus', 'asv_karpe_noktem', 'noviomagustam', 'nsba', 'nsv_ovum_novum', 'sv_sturad', 'vsa_nijmegen', 'gnsv_nijmegen', 'rsc_rvsv', 'rsv_sanctus_laurentius', 'ssr_rotterdam', 'rsg', 'nsr', 'vgsr', 'wbs', 'tsv_plato', 'sint_olof', 'totus', 'biton', 'sib_utrecht', 'ssr_nu', 'uhsv_anteros', 'umtc', 'unitas_srt', 'utrechtsch_studenten_corps', 'uvsv_nvvsu', 'veritas', 'ufo_stam', 'gnsv_utrecht', 'aqua_ad_vinum', 'marum_bibio', 'brabants_studenten_gilde', 'wsv_ceres', 'franciscus_xaverius', 't_noaberschop', 'dlv_nji_sri', 'ssr_w', 'unitas_wageningen', 'wsg_paragon', 'yggdrasilstam', 'zsv', 'gumbo_millennium', 'oikos_nomos', 'zhtc', 'other');--> statement-breakpoint
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
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp
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
CREATE TABLE "calendar_tokens" (
	"user_id" uuid PRIMARY KEY,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"avatar_url" text,
	"birth_date" date,
	"gender" "gender_enum",
	"bio" text,
	"study_program" text,
	"study_level" "study_level_enum",
	"vereniging" "vereniging_enum",
	"preferred_city" "city_enum",
	"lifestyle_tags" "lifestyle_tag_enum"[] DEFAULT '{}'::"lifestyle_tag_enum"[],
	"languages" "language_enum"[] DEFAULT '{}'::"language_enum"[],
	"preferred_locale" "locale_enum" DEFAULT 'nl'::"locale_enum",
	"notification_preferences" jsonb,
	"privacy_policy_accepted_version" text,
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
	"created_by" uuid,
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
	"street_name" text,
	"house_number" text,
	"postal_code" text,
	"latitude" double precision,
	"longitude" double precision,
	"rent_price" numeric(7,2) DEFAULT '0' NOT NULL,
	"deposit" numeric(7,2),
	"utilities_included" "utilities_included_enum" DEFAULT 'included'::"utilities_included_enum",
	"service_costs" numeric(7,2),
	"estimated_utilities_costs" numeric(7,2),
	"total_cost" numeric(7,2) GENERATED ALWAYS AS (rent_price + COALESCE(service_costs, 0) + COALESCE(estimated_utilities_costs, 0)) STORED,
	"room_size_m2" integer,
	"available_from" date,
	"available_until" date,
	"rental_type" "rental_type_enum" DEFAULT 'permanent'::"rental_type_enum",
	"house_type" "house_type_enum",
	"furnishing" "furnishing_enum",
	"total_housemates" integer,
	"features" "room_feature_enum"[] DEFAULT '{}'::"room_feature_enum"[],
	"location_tags" "location_tag_enum"[] DEFAULT '{}'::"location_tag_enum"[],
	"room_vereniging" "vereniging_enum",
	"preferred_gender" "gender_preference_enum" DEFAULT 'no_preference'::"gender_preference_enum",
	"preferred_age_min" integer,
	"preferred_age_max" integer,
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
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"application_id" uuid NOT NULL,
	"from_status" "application_status_enum",
	"to_status" "application_status_enum" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "application_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"created_by" uuid,
	"title" text NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"time_start" time NOT NULL,
	"time_end" time,
	"location" text,
	"rsvp_deadline" timestamp with time zone,
	"max_attendees" integer,
	"notes" text,
	"sequence" integer DEFAULT 0 NOT NULL,
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
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "conversation_members_pkey" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"room_id" uuid NOT NULL,
	"seeker_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_conversations_room_seeker" UNIQUE("room_id","seeker_user_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "message_payloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"message_id" uuid NOT NULL UNIQUE,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_device_id" uuid,
	"payload" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_payloads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"sender_device_id" uuid,
	"message_type" "message_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sender_key_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_device_id" uuid NOT NULL,
	"recipient_device_id" uuid NOT NULL,
	"ciphertext" text NOT NULL,
	"status" "sender_key_distribution_status_enum" DEFAULT 'pending'::"sender_key_distribution_status_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sender_key_distributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"registration_id" integer NOT NULL,
	"identity_key_public" text NOT NULL,
	"signing_key_public" text NOT NULL,
	"platform" "platform_enum" NOT NULL,
	"push_token" text,
	"last_seen_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "one_time_prekeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_id" uuid NOT NULL,
	"key_id" integer NOT NULL,
	"public_key" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_one_time_prekeys_device_key" UNIQUE("device_id","key_id")
);
--> statement-breakpoint
ALTER TABLE "one_time_prekeys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "private_key_backups" (
	"user_id" uuid PRIMARY KEY,
	"encrypted_data" text NOT NULL,
	"iv" text NOT NULL,
	"salt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private_key_backups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "signed_prekeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_id" uuid NOT NULL,
	"key_id" integer NOT NULL,
	"public_key" text NOT NULL,
	"signature" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_signed_prekeys_device_key" UNIQUE("device_id","key_id")
);
--> statement-breakpoint
ALTER TABLE "signed_prekeys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" uuid,
	"blocked_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_pkey" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"report_type" "report_type_enum" NOT NULL,
	"reporter_id" uuid,
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
CREATE TABLE "active_consents" (
	"user_id" uuid,
	"purpose" "consent_purpose_enum",
	"granted" boolean NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "active_consents_pkey" PRIMARY KEY("user_id","purpose")
);
--> statement-breakpoint
ALTER TABLE "active_consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"purpose" "consent_purpose_enum" NOT NULL,
	"granted" boolean NOT NULL,
	"legal_basis" "legal_basis_enum" NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" "data_request_type_enum" NOT NULL,
	"status" "data_request_status_enum" DEFAULT 'pending'::"data_request_status_enum" NOT NULL,
	"description" text,
	"admin_notes" text,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "processing_restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"restricted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"lifted_at" timestamp with time zone,
	"lifted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "processing_restrictions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "admin_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE INDEX "idx_calendar_tokens_token" ON "calendar_tokens" ("token");--> statement-breakpoint
CREATE INDEX "idx_profile_photos_user" ON "profile_photos" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_vereniging" ON "profiles" ("id","vereniging") WHERE ("vereniging" is not null);--> statement-breakpoint
CREATE INDEX "idx_house_members_user_id" ON "house_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_house_members_house_id" ON "house_members" ("house_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_city_status" ON "rooms" ("city","status");--> statement-breakpoint
CREATE INDEX "idx_rooms_rent_price" ON "rooms" ("rent_price");--> statement-breakpoint
CREATE INDEX "idx_rooms_available_from" ON "rooms" ("available_from");--> statement-breakpoint
CREATE INDEX "idx_rooms_vereniging" ON "rooms" ("room_vereniging") WHERE ("room_vereniging" is not null);--> statement-breakpoint
CREATE INDEX "idx_app_status_history_app_id" ON "application_status_history" ("application_id");--> statement-breakpoint
CREATE INDEX "idx_applications_user_id" ON "applications" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_applications_room_id_status" ON "applications" ("room_id","status");--> statement-breakpoint
CREATE INDEX "idx_hospi_invitations_event_id" ON "hospi_invitations" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_hospi_invitations_user_id" ON "hospi_invitations" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversation_members_user_id" ON "conversation_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_room_id" ON "conversations" ("room_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_seeker" ON "conversations" ("seeker_user_id");--> statement-breakpoint
CREATE INDEX "idx_message_payloads_conversation" ON "message_payloads" ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_message_receipts_user_id" ON "message_receipts" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_created" ON "messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_sender_id" ON "messages" ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_skd_recipient_status" ON "sender_key_distributions" ("recipient_device_id","status");--> statement-breakpoint
CREATE INDEX "idx_skd_conversation" ON "sender_key_distributions" ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_devices_user_id" ON "devices" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_one_time_prekeys_device_id_used" ON "one_time_prekeys" ("device_id","used");--> statement-breakpoint
CREATE INDEX "idx_signed_prekeys_device_id" ON "signed_prekeys" ("device_id");--> statement-breakpoint
CREATE INDEX "idx_blocks_blocked_id" ON "blocks" ("blocked_id");--> statement-breakpoint
CREATE INDEX "idx_reports_type_status_date" ON "reports" ("report_type","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_created_at" ON "reports" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_consent_records_user" ON "consent_records" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_consent_records_user_purpose" ON "consent_records" ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "idx_data_requests_user" ON "data_requests" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_data_requests_status" ON "data_requests" ("status");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_log_created_at" ON "admin_audit_log" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user_id" ON "push_subscriptions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_tokens_user_id" ON "push_tokens" ("user_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "calendar_tokens" ADD CONSTRAINT "calendar_tokens_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "room_photos" ADD CONSTRAINT "room_photos_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_profiles_id_fkey" FOREIGN KEY ("changed_by") REFERENCES "profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_applicant_id_profiles_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_events" ADD CONSTRAINT "hospi_events_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_events" ADD CONSTRAINT "hospi_events_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_event_id_hospi_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "hospi_events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hospi_invitations" ADD CONSTRAINT "hospi_invitations_application_id_applications_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_profiles_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_applicant_id_profiles_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_room_id_rooms_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seeker_user_id_user_id_fkey" FOREIGN KEY ("seeker_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_payloads" ADD CONSTRAINT "message_payloads_message_id_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_payloads" ADD CONSTRAINT "message_payloads_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_payloads" ADD CONSTRAINT "message_payloads_sender_user_id_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_payloads" ADD CONSTRAINT "message_payloads_sender_device_id_devices_id_fkey" FOREIGN KEY ("sender_device_id") REFERENCES "devices"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_message_id_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_device_id_devices_id_fkey" FOREIGN KEY ("sender_device_id") REFERENCES "devices"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sender_key_distributions" ADD CONSTRAINT "sender_key_distributions_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sender_key_distributions" ADD CONSTRAINT "sender_key_distributions_sender_user_id_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sender_key_distributions" ADD CONSTRAINT "sender_key_distributions_sender_device_id_devices_id_fkey" FOREIGN KEY ("sender_device_id") REFERENCES "devices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sender_key_distributions" ADD CONSTRAINT "sender_key_distributions_recipient_device_id_devices_id_fkey" FOREIGN KEY ("recipient_device_id") REFERENCES "devices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "one_time_prekeys" ADD CONSTRAINT "one_time_prekeys_device_id_devices_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "private_key_backups" ADD CONSTRAINT "private_key_backups_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "signed_prekeys" ADD CONSTRAINT "signed_prekeys_device_id_devices_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_profiles_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_profiles_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_profiles_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_room_id_rooms_id_fkey" FOREIGN KEY ("reported_room_id") REFERENCES "rooms"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_message_id_messages_id_fkey" FOREIGN KEY ("reported_message_id") REFERENCES "messages"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "active_consents" ADD CONSTRAINT "active_consents_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "processing_restrictions" ADD CONSTRAINT "processing_restrictions_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "conversation_members_rls" AS (SELECT "conversation_members"."conversation_id", "conversation_members"."user_id" FROM "conversation_members");--> statement-breakpoint
CREATE VIEW "hospi_invitations_rls" AS (SELECT "hospi_invitations"."event_id", "hospi_invitations"."user_id" FROM "hospi_invitations");--> statement-breakpoint
CREATE VIEW "house_members_rls" AS (SELECT "house_members"."house_id", "house_members"."user_id", "house_members"."role" FROM "house_members");--> statement-breakpoint
CREATE VIEW "room_members_rls" AS (SELECT "rooms"."id" AS "room_id", "house_members"."user_id", "house_members"."role" FROM "house_members" INNER JOIN "rooms" ON "rooms"."house_id" = "house_members"."house_id");--> statement-breakpoint
CREATE POLICY "calendar_tokens_select_own" ON "calendar_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("calendar_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "calendar_tokens_insert_own" ON "calendar_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("calendar_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "calendar_tokens_update_own" ON "calendar_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("calendar_tokens"."user_id" = (select auth.uid())) WITH CHECK ("calendar_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "calendar_tokens_delete_own" ON "calendar_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("calendar_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
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
CREATE POLICY "room_photos_select" ON "room_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and (rooms.status = 'active' or rooms.created_by = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "room_photos_insert" ON "room_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "room_photos_update" ON "room_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid()))) WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "room_photos_delete" ON "room_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "rooms_select_anon" ON "rooms" AS PERMISSIVE FOR SELECT TO "anon" USING ("rooms"."status" = 'active');--> statement-breakpoint
CREATE POLICY "rooms_select_auth" ON "rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("rooms"."status" = 'active' or "rooms"."created_by" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "rooms_insert_own" ON "rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "rooms_update_own" ON "rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("rooms"."created_by" = (select auth.uid())) WITH CHECK ("rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "rooms_delete_own" ON "rooms" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("rooms"."created_by" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "app_status_history_select" ON "application_status_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from applications where applications.id = "application_status_history"."application_id" and (applications.user_id = (select auth.uid()) or exists(select 1 from room_members_rls where room_members_rls.room_id = applications.room_id and room_members_rls.user_id = (select auth.uid())))));--> statement-breakpoint
CREATE POLICY "app_status_history_insert" ON "application_status_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from applications where applications.id = "application_status_history"."application_id" and (applications.user_id = (select auth.uid()) or exists(select 1 from room_members_rls where room_members_rls.room_id = applications.room_id and room_members_rls.user_id = (select auth.uid())))));--> statement-breakpoint
CREATE POLICY "applications_select" ON "applications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "applications_insert" ON "applications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("applications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "applications_update" ON "applications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.uid()) and room_members_rls.role = 'owner'));--> statement-breakpoint
CREATE POLICY "reviews_select" ON "reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reviews_insert" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reviews"."reviewer_id" = (select auth.uid()) and exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "reviews_update" ON "reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("reviews"."reviewer_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "hospi_events_select" ON "hospi_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "hospi_events"."room_id" and room_members_rls.user_id = (select auth.uid())) or exists(select 1 from hospi_invitations_rls where hospi_invitations_rls.event_id = "hospi_events"."id" and hospi_invitations_rls.user_id = (select auth.uid())));--> statement-breakpoint
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
CREATE POLICY "conversation_members_select_member" ON "conversation_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("conversation_members"."user_id" = (select auth.uid()) or exists(select 1 from conversation_members_rls cm where cm.conversation_id = "conversation_members"."conversation_id" and cm.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "conversation_members_insert_authenticated" ON "conversation_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "conversation_members_update_own" ON "conversation_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("conversation_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "conversations_select_member" ON "conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "conversations"."id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "conversations_insert_authenticated" ON "conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "message_payloads_select_member" ON "message_payloads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "message_payloads"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "message_payloads_insert_sender" ON "message_payloads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("message_payloads"."sender_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_select_own" ON "message_receipts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_update_own" ON "message_receipts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("message_receipts"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "message_receipts_insert_authenticated" ON "message_receipts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "messages_select_member" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = "messages"."conversation_id" and conversation_members_rls.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "messages_insert_sender" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("messages"."sender_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "skd_select_participant" ON "sender_key_distributions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from devices where devices.id = "sender_key_distributions"."recipient_device_id" and devices.user_id = (select auth.uid())) or "sender_key_distributions"."sender_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "skd_insert_sender" ON "sender_key_distributions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("sender_key_distributions"."sender_user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "skd_update_recipient" ON "sender_key_distributions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from devices where devices.id = "sender_key_distributions"."recipient_device_id" and devices.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "devices_select_authenticated" ON "devices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "devices_insert_own" ON "devices" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("devices"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "devices_update_own" ON "devices" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("devices"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "devices_delete_own" ON "devices" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("devices"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "one_time_prekeys_select_authenticated" ON "one_time_prekeys" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "one_time_prekeys_insert_own" ON "one_time_prekeys" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from devices where devices.id = "one_time_prekeys"."device_id" and devices.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "one_time_prekeys_update_authenticated" ON "one_time_prekeys" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "private_key_backups_select_own" ON "private_key_backups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_insert_own" ON "private_key_backups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_update_own" ON "private_key_backups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "private_key_backups_delete_own" ON "private_key_backups" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("private_key_backups"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "signed_prekeys_select_authenticated" ON "signed_prekeys" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "signed_prekeys_insert_own" ON "signed_prekeys" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from devices where devices.id = "signed_prekeys"."device_id" and devices.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "blocks_select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_update" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid())) WITH CHECK ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "blocks_delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("blocks"."blocker_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_insert_own" ON "reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reports"."reporter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_select_own" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("reports"."reporter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_select_admin" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "reports_update_admin" ON "reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "active_consents_select_own" ON "active_consents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("active_consents"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "active_consents_insert_own" ON "active_consents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("active_consents"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "active_consents_update_own" ON "active_consents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("active_consents"."user_id" = (select auth.uid())) WITH CHECK ("active_consents"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "consent_records_select_own" ON "consent_records" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("consent_records"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "consent_records_insert_own" ON "consent_records" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("consent_records"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "data_requests_select_own" ON "data_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("data_requests"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "data_requests_insert_own" ON "data_requests" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("data_requests"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "data_requests_select_admin" ON "data_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "data_requests_update_admin" ON "data_requests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "processing_restrictions_select_own" ON "processing_restrictions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("processing_restrictions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "processing_restrictions_insert_own" ON "processing_restrictions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("processing_restrictions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "processing_restrictions_select_admin" ON "processing_restrictions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "processing_restrictions_update_admin" ON "processing_restrictions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "admin_audit_log_insert" ON "admin_audit_log" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "admin_audit_log_select" ON "admin_audit_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from "user" where "user".id = (select auth.uid()) and "user".role = 'admin'));--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = (select auth.uid())) WITH CHECK ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_subscriptions_select" ON "push_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("push_subscriptions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_subscriptions_insert" ON "push_subscriptions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("push_subscriptions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_subscriptions_delete" ON "push_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("push_subscriptions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_select" ON "push_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_insert" ON "push_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_update" ON "push_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid())) WITH CHECK ("push_tokens"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "push_tokens_delete" ON "push_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("push_tokens"."user_id" = (select auth.uid()));