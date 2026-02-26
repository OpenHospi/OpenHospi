CREATE OR REPLACE FUNCTION public.text_eq_uuid(text, uuid) RETURNS boolean LANGUAGE SQL IMMUTABLE AS $$ SELECT $1::uuid = $2 $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.uuid_eq_text(uuid, text) RETURNS boolean LANGUAGE SQL IMMUTABLE AS $$ SELECT $1 = $2::uuid $$;
--> statement-breakpoint
CREATE OPERATOR public.= (LEFTARG = text, RIGHTARG = uuid, FUNCTION = public.text_eq_uuid);
--> statement-breakpoint
CREATE OPERATOR public.= (LEFTARG = uuid, RIGHTARG = text, FUNCTION = public.uuid_eq_text);
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO anonymous;
--> statement-breakpoint
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anonymous;
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "profile_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "profile_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "profile_photos"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "profile_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "profile_photos"."user_id")) WITH CHECK ((select auth.user_id() = "profile_photos"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "profile_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "profile_photos"."user_id"));
--> statement-breakpoint
CREATE POLICY "profiles_select" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "profiles"."id")) WITH CHECK ((select auth.user_id() = "profiles"."id"));
--> statement-breakpoint
CREATE POLICY "housemates_select" ON "housemates" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from housemates h2 where h2.room_id = "housemates"."room_id" and h2.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "housemates_insert" ON "housemates" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from rooms where rooms.id = "housemates"."room_id" and rooms.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "housemates_delete" ON "housemates" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "housemates"."room_id" and rooms.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "room_photos_select_anon" ON "room_photos" AS PERMISSIVE FOR SELECT TO "anonymous" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.status = 'active'));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "room_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "room_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "room_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.user_id()))) WITH CHECK (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "room_photos" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from rooms where rooms.id = "room_photos"."room_id" and rooms.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "rooms_select_anon" ON "rooms" AS PERMISSIVE FOR SELECT TO "anonymous" USING ("rooms"."status" = 'active');
--> statement-breakpoint
CREATE POLICY "rooms_select_auth" ON "rooms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("rooms"."status" = 'active' or (select auth.user_id() = "rooms"."created_by")));
--> statement-breakpoint
CREATE POLICY "rooms_insert_own" ON "rooms" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "rooms"."created_by"));
--> statement-breakpoint
CREATE POLICY "rooms_update_own" ON "rooms" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "rooms"."created_by")) WITH CHECK ((select auth.user_id() = "rooms"."created_by"));
--> statement-breakpoint
CREATE POLICY "applications_select" ON "applications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()) = "applications"."user_id" or exists(select 1 from housemates where housemates.room_id = "applications"."room_id" and housemates.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "applications_insert" ON "applications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "applications"."user_id"));
--> statement-breakpoint
CREATE POLICY "applications_update" ON "applications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()) = "applications"."user_id" or exists(select 1 from housemates where housemates.room_id = "applications"."room_id" and housemates.user_id = (select auth.user_id()) and housemates.role in ('owner', 'admin')));
--> statement-breakpoint
CREATE POLICY "reviews_select" ON "reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from housemates where housemates.room_id = "reviews"."room_id" and housemates.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "reviews_insert" ON "reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "reviews"."reviewer_id") and exists(select 1 from housemates where housemates.room_id = "reviews"."room_id" and housemates.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "reviews_update" ON "reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "reviews"."reviewer_id"));
--> statement-breakpoint
CREATE POLICY "hospi_events_select" ON "hospi_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from housemates where housemates.room_id = "hospi_events"."room_id" and housemates.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "hospi_events_insert" ON "hospi_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "hospi_events"."created_by"));
--> statement-breakpoint
CREATE POLICY "hospi_events_update" ON "hospi_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "hospi_events"."created_by")) WITH CHECK ((select auth.user_id() = "hospi_events"."created_by"));
--> statement-breakpoint
CREATE POLICY "hospi_events_delete" ON "hospi_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "hospi_events"."created_by"));
--> statement-breakpoint
CREATE POLICY "hospi_invitations_select" ON "hospi_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.user_id()) or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "hospi_invitations_insert" ON "hospi_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "hospi_invitations_update" ON "hospi_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.user_id()) or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "hospi_invitations_delete" ON "hospi_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "votes"."voter_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "votes"."voter_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "votes"."voter_id")) WITH CHECK ((select auth.user_id() = "votes"."voter_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "votes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "votes"."voter_id"));
--> statement-breakpoint
CREATE POLICY "conversation_members_select" ON "conversation_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members cm2 where cm2.conversation_id = "conversation_members"."conversation_id" and cm2.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "conversation_members_insert" ON "conversation_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("conversation_members"."user_id" = (select auth.user_id()) or exists(select 1 from conversation_members cm2 where cm2.conversation_id = "conversation_members"."conversation_id" and cm2.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "conversation_members_update" ON "conversation_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "conversation_members"."user_id"));
--> statement-breakpoint
CREATE POLICY "conversation_members_delete" ON "conversation_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "conversation_members"."user_id"));
--> statement-breakpoint
CREATE POLICY "conversations_select" ON "conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members where conversation_members.conversation_id = "conversations"."id" and conversation_members.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "conversations_insert" ON "conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "message_receipts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "message_receipts"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "message_receipts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "message_receipts"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "message_receipts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "message_receipts"."user_id")) WITH CHECK ((select auth.user_id() = "message_receipts"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "message_receipts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "message_receipts"."user_id"));
--> statement-breakpoint
CREATE POLICY "messages_select" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members where conversation_members.conversation_id = "messages"."conversation_id" and conversation_members.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "messages_insert" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("messages"."sender_id" = (select auth.user_id()) and exists(select 1 from conversation_members where conversation_members.conversation_id = "messages"."conversation_id" and conversation_members.user_id = (select auth.user_id())));
--> statement-breakpoint
CREATE POLICY "messages_update" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "messages"."sender_id"));
--> statement-breakpoint
CREATE POLICY "messages_delete" ON "messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "messages"."sender_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "blocks"."blocker_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "blocks"."blocker_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "blocks"."blocker_id")) WITH CHECK ((select auth.user_id() = "blocks"."blocker_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "blocks"."blocker_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "private_key_backups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "private_key_backups"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "private_key_backups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "private_key_backups"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "private_key_backups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "private_key_backups"."user_id")) WITH CHECK ((select auth.user_id() = "private_key_backups"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "private_key_backups" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "private_key_backups"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "public_keys" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "public_keys" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "public_keys"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "public_keys" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "public_keys"."user_id")) WITH CHECK ((select auth.user_id() = "public_keys"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "public_keys" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "public_keys"."user_id"));
--> statement-breakpoint
CREATE POLICY "reports_insert_own" ON "reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "reports"."reporter_id"));
--> statement-breakpoint
CREATE POLICY "reports_select_own" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "reports"."reporter_id"));
--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "notifications"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "push_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "push_tokens"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "push_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "push_tokens"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "push_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "push_tokens"."user_id")) WITH CHECK ((select auth.user_id() = "push_tokens"."user_id"));
--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "push_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "push_tokens"."user_id"));