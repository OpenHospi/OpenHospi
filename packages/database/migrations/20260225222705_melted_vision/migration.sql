DROP POLICY "crud-authenticated-policy-select" ON "hospi_events";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "hospi_events";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "hospi_events";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "hospi_events";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-select" ON "hospi_invitations";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "hospi_invitations";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "hospi_invitations";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "hospi_invitations";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-select" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "votes";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-select" ON "conversation_members";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "conversation_members";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "conversation_members";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "conversation_members";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-select" ON "message_receipts";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "message_receipts";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "message_receipts";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "message_receipts";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-insert" ON "messages";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-update" ON "messages";--> statement-breakpoint
DROP POLICY "crud-authenticated-policy-delete" ON "messages";--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hospi_events_select" ON "hospi_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from housemates where housemates.room_id = "hospi_events"."room_id" and housemates.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "hospi_events_insert" ON "hospi_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id())::uuid = "hospi_events"."created_by");--> statement-breakpoint
CREATE POLICY "hospi_events_update" ON "hospi_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id())::uuid = "hospi_events"."created_by") WITH CHECK ((select auth.user_id())::uuid = "hospi_events"."created_by");--> statement-breakpoint
CREATE POLICY "hospi_events_delete" ON "hospi_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id())::uuid = "hospi_events"."created_by");--> statement-breakpoint
CREATE POLICY "hospi_invitations_select" ON "hospi_invitations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.user_id())::uuid or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "hospi_invitations_insert" ON "hospi_invitations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "hospi_invitations_update" ON "hospi_invitations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("hospi_invitations"."user_id" = (select auth.user_id())::uuid or exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "hospi_invitations_delete" ON "hospi_invitations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists(select 1 from hospi_events where hospi_events.id = "hospi_invitations"."event_id" and hospi_events.created_by = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "votes_select" ON "votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id())::uuid = "votes"."voter_id");--> statement-breakpoint
CREATE POLICY "votes_insert" ON "votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id())::uuid = "votes"."voter_id");--> statement-breakpoint
CREATE POLICY "votes_update" ON "votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id())::uuid = "votes"."voter_id") WITH CHECK ((select auth.user_id())::uuid = "votes"."voter_id");--> statement-breakpoint
CREATE POLICY "votes_delete" ON "votes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id())::uuid = "votes"."voter_id");--> statement-breakpoint
CREATE POLICY "conversation_members_select" ON "conversation_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members cm2 where cm2.conversation_id = "conversation_members"."conversation_id" and cm2.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "conversation_members_insert" ON "conversation_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("conversation_members"."user_id" = (select auth.user_id())::uuid or exists(select 1 from conversation_members cm2 where cm2.conversation_id = "conversation_members"."conversation_id" and cm2.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "conversation_members_update" ON "conversation_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id())::uuid = "conversation_members"."user_id");--> statement-breakpoint
CREATE POLICY "conversation_members_delete" ON "conversation_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id())::uuid = "conversation_members"."user_id");--> statement-breakpoint
CREATE POLICY "conversations_select" ON "conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members where conversation_members.conversation_id = "conversations"."id" and conversation_members.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "conversations_insert" ON "conversations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "message_receipts_select" ON "message_receipts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id())::uuid = "message_receipts"."user_id");--> statement-breakpoint
CREATE POLICY "message_receipts_insert" ON "message_receipts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id())::uuid = "message_receipts"."user_id");--> statement-breakpoint
CREATE POLICY "message_receipts_update" ON "message_receipts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id())::uuid = "message_receipts"."user_id");--> statement-breakpoint
CREATE POLICY "message_receipts_delete" ON "message_receipts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id())::uuid = "message_receipts"."user_id");--> statement-breakpoint
CREATE POLICY "messages_select" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists(select 1 from conversation_members where conversation_members.conversation_id = "messages"."conversation_id" and conversation_members.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "messages_insert" ON "messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("messages"."sender_id" = (select auth.user_id())::uuid and exists(select 1 from conversation_members where conversation_members.conversation_id = "messages"."conversation_id" and conversation_members.user_id = (select auth.user_id())::uuid));--> statement-breakpoint
CREATE POLICY "messages_update" ON "messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id())::uuid = "messages"."sender_id");--> statement-breakpoint
CREATE POLICY "messages_delete" ON "messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id())::uuid = "messages"."sender_id");