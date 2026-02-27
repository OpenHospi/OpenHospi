DROP POLICY "crud-authenticated-policy-select" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "votes";--> statement-breakpoint
CREATE POLICY "votes_select" ON "votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from room_members_rls where room_members_rls.room_id = "votes"."room_id" and room_members_rls.user_id = (select auth.user_id())));--> statement-breakpoint
CREATE POLICY "votes_insert" ON "votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "votes"."voter_id"));--> statement-breakpoint
CREATE POLICY "votes_update" ON "votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "votes"."voter_id")) WITH CHECK ((select auth.user_id() = "votes"."voter_id"));--> statement-breakpoint
CREATE POLICY "votes_delete" ON "votes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "votes"."voter_id"));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "notifications"."user_id")) WITH CHECK ((select auth.user_id() = "notifications"."user_id"));