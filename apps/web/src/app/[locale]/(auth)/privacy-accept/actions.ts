"use server";

import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function acceptPrivacyPolicy() {
  const session = await requireSession();

  await createDrizzleSupabaseClient(session.user.id).rls((tx) =>
    tx
      .update(profiles)
      .set({ privacyPolicyAcceptedVersion: PRIVACY_POLICY_VERSION })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}
