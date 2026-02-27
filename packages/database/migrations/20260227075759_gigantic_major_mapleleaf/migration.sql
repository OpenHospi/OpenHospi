CREATE TYPE "locale_enum" AS ENUM('nl', 'en', 'de');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "preferred_locale" "locale_enum" DEFAULT 'nl'::"locale_enum";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp with time zone;