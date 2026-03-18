/**
 * Sets up Supabase Storage RLS policies for profile-photos and room-photos.
 *
 * The `storage.objects` table is owned by `supabase_storage_admin` —
 * only a superuser (`supabase_admin`) can create policies on it.
 * Drizzle cannot manage these because the storage schema is Supabase-internal.
 *
 * Run after `db:push:local` so that `public.rooms` exists:
 *
 *   pnpm db:setup:storage:local
 */

import postgres from "postgres";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Use the Supabase dashboard to manage storage policies in production.");
  }

  const SUPERUSER_URL = "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres";
  const sql = postgres(SUPERUSER_URL);

  /** Create a policy idempotently (skip if it already exists). */
  async function createPolicy(definition: string) {
    await sql.unsafe(`
      DO $$ BEGIN
        ${definition}
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  // ── Profile Photos ────────────────────────────────────────────────────

  await createPolicy(`
    CREATE POLICY "storage_profile_photos_select"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'profile-photos');
  `);

  await createPolicy(`
    CREATE POLICY "storage_profile_photos_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  `);

  await createPolicy(`
    CREATE POLICY "storage_profile_photos_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  `);

  await createPolicy(`
    CREATE POLICY "storage_profile_photos_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-photos'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  `);

  // ── Room Photos ───────────────────────────────────────────────────────

  await createPolicy(`
    CREATE POLICY "storage_room_photos_select"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'room-photos');
  `);

  await createPolicy(`
    CREATE POLICY "storage_room_photos_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'room-photos'
        AND exists(
          select 1 from public.rooms
          where rooms.id::text = (storage.foldername(name))[1]
            and rooms.created_by = (select auth.uid())
        )
      );
  `);

  await createPolicy(`
    CREATE POLICY "storage_room_photos_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'room-photos'
        AND exists(
          select 1 from public.rooms
          where rooms.id::text = (storage.foldername(name))[1]
            and rooms.created_by = (select auth.uid())
        )
      );
  `);

  await createPolicy(`
    CREATE POLICY "storage_room_photos_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'room-photos'
        AND exists(
          select 1 from public.rooms
          where rooms.id::text = (storage.foldername(name))[1]
            and rooms.created_by = (select auth.uid())
        )
      );
  `);

  await sql.end();
  console.log("Storage RLS policies created successfully.");
}

main();

