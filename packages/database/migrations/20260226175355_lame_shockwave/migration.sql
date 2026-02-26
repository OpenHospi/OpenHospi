CREATE TYPE "house_member_role_enum" AS ENUM('owner', 'member');--> statement-breakpoint
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
ALTER TABLE "houses" ADD CONSTRAINT "houses_created_by_profiles_id_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "house_members" ADD CONSTRAINT "house_members_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "house_id" uuid;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_house_id_houses_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id");--> statement-breakpoint
DROP VIEW "room_members_rls" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "housemates_insert" ON "housemates";--> statement-breakpoint
DROP POLICY IF EXISTS "housemates_delete" ON "housemates";--> statement-breakpoint
DROP TABLE "housemates";--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "house_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
CREATE INDEX "idx_house_members_user_id" ON "house_members" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_house_members_house_id" ON "house_members" ("house_id");--> statement-breakpoint
CREATE VIEW "house_members_rls" AS (select "house_id", "user_id", "role" from "house_members");--> statement-breakpoint
CREATE VIEW "room_members_rls" AS (select "rooms"."id" as "room_id", "house_members"."user_id", "house_members"."role" from "house_members" inner join "rooms" on "rooms"."house_id" = "house_members"."house_id");--> statement-breakpoint
CREATE POLICY "house_members_select" ON "house_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from house_members_rls where house_members_rls.house_id = "house_members"."house_id" and house_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "house_members_insert" ON "house_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from houses where houses.id = "house_members"."house_id" and houses.created_by = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "house_members_delete" ON "house_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from houses where houses.id = "house_members"."house_id" and houses.created_by = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "houses_select" ON "houses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((select auth.user_id() = "houses"."created_by") or exists(select 1 from house_members_rls where house_members_rls.house_id = "houses"."id" and house_members_rls.user_id = (select auth.user_id()))));--> statement-breakpoint
CREATE POLICY "houses_insert" ON "houses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "houses"."created_by"));--> statement-breakpoint
CREATE POLICY "houses_update" ON "houses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "houses"."created_by")) WITH CHECK ((select auth.user_id() = "houses"."created_by"));--> statement-breakpoint
CREATE POLICY "applications_select" ON "applications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "applications_update" ON "applications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()) = "applications"."user_id" or exists(select 1 from room_members_rls where room_members_rls.room_id = "applications"."room_id" and room_members_rls.user_id = (select auth.user_id()) and room_members_rls.role = 'owner'));--> statement-breakpoint
CREATE POLICY "reviews_select" ON "reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "reviews_insert" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "reviews"."reviewer_id") and exists(select 1 from room_members_rls where room_members_rls.room_id = "reviews"."room_id" and room_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "hospi_events_select" ON "hospi_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "hospi_events"."room_id" and room_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
DROP TYPE "housemate_role_enum";
