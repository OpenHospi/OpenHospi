-- ===========================================================================
-- RLS Policies
-- ===========================================================================
-- Adds Row Level Security policies for all 19 public tables.
-- Better Auth tables (user, session, account, verification, ssoProvider)
-- already have RLS enabled with zero policies (denies all PostgREST access).
-- ===========================================================================

-- -------------------------------------------------------
-- 1. Helper Functions (SECURITY DEFINER)
-- -------------------------------------------------------

-- Check if auth.uid() is a housemate of a room, optionally with specific roles
CREATE OR REPLACE FUNCTION public.is_housemate(
  _room_id uuid,
  _roles housemate_role_enum[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.housemates
    WHERE room_id = _room_id
      AND user_id = (SELECT auth.uid())
      AND (_roles IS NULL OR role = ANY(_roles))
  );
$$;

-- Check if auth.uid() is a member of a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = _conversation_id
      AND user_id = (SELECT auth.uid())
  );
$$;

-- -------------------------------------------------------
-- 2. Policies per table
-- -------------------------------------------------------

-- ========== profiles ==========
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE TO authenticated USING (id = (SELECT auth.uid()));

-- ========== rooms ==========
CREATE POLICY rooms_select ON public.rooms
  FOR SELECT TO authenticated
  USING (status = 'active' OR created_by = (SELECT auth.uid()));
CREATE POLICY rooms_insert ON public.rooms
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY rooms_update ON public.rooms
  FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid()));
CREATE POLICY rooms_delete ON public.rooms
  FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ========== housemates ==========
CREATE POLICY housemates_select ON public.housemates
  FOR SELECT TO authenticated
  USING (public.is_housemate(room_id));
CREATE POLICY housemates_insert ON public.housemates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_housemate(room_id, ARRAY['owner','admin']::housemate_role_enum[]));
CREATE POLICY housemates_update ON public.housemates
  FOR UPDATE TO authenticated
  USING (public.is_housemate(room_id, ARRAY['owner','admin']::housemate_role_enum[]));
CREATE POLICY housemates_delete ON public.housemates
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_housemate(room_id, ARRAY['owner','admin']::housemate_role_enum[])
  );

-- ========== applications ==========
CREATE POLICY applications_select ON public.applications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_housemate(room_id));
CREATE POLICY applications_insert ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY applications_update ON public.applications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_housemate(room_id));
CREATE POLICY applications_delete ON public.applications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== reviews ==========
CREATE POLICY reviews_select ON public.reviews
  FOR SELECT TO authenticated
  USING (public.is_housemate(room_id));
CREATE POLICY reviews_insert ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND public.is_housemate(room_id)
  );
CREATE POLICY reviews_update ON public.reviews
  FOR UPDATE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));
CREATE POLICY reviews_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

-- ========== hospi_events ==========
CREATE POLICY hospi_events_select ON public.hospi_events
  FOR SELECT TO authenticated
  USING (
    public.is_housemate(room_id)
    OR EXISTS (
      SELECT 1 FROM public.hospi_invitations hi
      WHERE hi.event_id = id AND hi.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY hospi_events_insert ON public.hospi_events
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.is_housemate(room_id)
  );
CREATE POLICY hospi_events_update ON public.hospi_events
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR public.is_housemate(room_id, ARRAY['owner','admin']::housemate_role_enum[])
  );
CREATE POLICY hospi_events_delete ON public.hospi_events
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR public.is_housemate(room_id, ARRAY['owner','admin']::housemate_role_enum[])
  );

-- ========== hospi_invitations ==========
CREATE POLICY hospi_invitations_select ON public.hospi_invitations
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.hospi_events e
      WHERE e.id = event_id AND public.is_housemate(e.room_id)
    )
  );
CREATE POLICY hospi_invitations_insert ON public.hospi_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hospi_events e
      WHERE e.id = event_id AND public.is_housemate(e.room_id)
    )
  );
CREATE POLICY hospi_invitations_update ON public.hospi_invitations
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.hospi_events e
      WHERE e.id = event_id AND public.is_housemate(e.room_id)
    )
  );
CREATE POLICY hospi_invitations_delete ON public.hospi_invitations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hospi_events e
      WHERE e.id = event_id AND public.is_housemate(e.room_id)
    )
  );

-- ========== votes ==========
CREATE POLICY votes_select ON public.votes
  FOR SELECT TO authenticated
  USING (public.is_housemate(room_id));
CREATE POLICY votes_insert ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (
    voter_id = (SELECT auth.uid())
    AND public.is_housemate(room_id)
  );
CREATE POLICY votes_update ON public.votes
  FOR UPDATE TO authenticated
  USING (voter_id = (SELECT auth.uid()));
CREATE POLICY votes_delete ON public.votes
  FOR DELETE TO authenticated
  USING (voter_id = (SELECT auth.uid()));

-- ========== conversations ==========
CREATE POLICY conversations_select ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(id));
CREATE POLICY conversations_insert ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ========== conversation_members ==========
CREATE POLICY conversation_members_select ON public.conversation_members
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));
CREATE POLICY conversation_members_insert ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.is_conversation_member(conversation_id)
  );
CREATE POLICY conversation_members_update ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY conversation_members_delete ON public.conversation_members
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== messages ==========
CREATE POLICY messages_select ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));
CREATE POLICY messages_insert ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND public.is_conversation_member(conversation_id)
  );

-- ========== message_receipts ==========
CREATE POLICY message_receipts_select ON public.message_receipts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND public.is_conversation_member(m.conversation_id)
    )
  );
CREATE POLICY message_receipts_insert ON public.message_receipts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY message_receipts_update ON public.message_receipts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== public_keys ==========
CREATE POLICY public_keys_select ON public.public_keys
  FOR SELECT TO authenticated USING (true);
CREATE POLICY public_keys_insert ON public.public_keys
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY public_keys_update ON public.public_keys
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY public_keys_delete ON public.public_keys
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== private_key_backups ==========
CREATE POLICY private_key_backups_select ON public.private_key_backups
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY private_key_backups_insert ON public.private_key_backups
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY private_key_backups_update ON public.private_key_backups
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY private_key_backups_delete ON public.private_key_backups
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== reports ==========
CREATE POLICY reports_select ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));
CREATE POLICY reports_insert ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

-- ========== blocks ==========
CREATE POLICY blocks_select ON public.blocks
  FOR SELECT TO authenticated
  USING (blocker_id = (SELECT auth.uid()));
CREATE POLICY blocks_insert ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = (SELECT auth.uid()));
CREATE POLICY blocks_delete ON public.blocks
  FOR DELETE TO authenticated
  USING (blocker_id = (SELECT auth.uid()));

-- ========== push_tokens ==========
CREATE POLICY push_tokens_select ON public.push_tokens
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY push_tokens_insert ON public.push_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY push_tokens_update ON public.push_tokens
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY push_tokens_delete ON public.push_tokens
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== notifications ==========
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ========== admin_audit_log ==========
-- No policies: all access denied for authenticated users (service role only)
