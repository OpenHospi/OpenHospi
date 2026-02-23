import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { pool } from "./db";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(locale: string) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}

export async function requireCompleteProfile(userId: string, locale: string) {
  const { rows } = await pool.query(
    `SELECT
       gender IS NOT NULL
       AND birth_date IS NOT NULL
       AND study_program IS NOT NULL
       AND preferred_city IS NOT NULL
       AND available_from IS NOT NULL
       AND array_length(lifestyle_tags, 1) >= 2
       AND EXISTS (SELECT 1 FROM profile_photos WHERE user_id = p.id)
     AS complete
     FROM profiles p WHERE id = $1`,
    [userId],
  );

  if (rows.length === 0 || !rows[0].complete) {
    redirect(`/${locale}/onboarding`);
  }
}
