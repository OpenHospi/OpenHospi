"use server";

import { withRLS } from "@openhospi/database";
import { profiles } from "@openhospi/database/schema";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";

export async function acceptPrivacyPolicy() {
  const session = await requireSession();

  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({ privacyPolicyAcceptedVersion: PRIVACY_POLICY_VERSION })
      .where(eq(profiles.id, session.user.id)),
  );

  return { success: true };
}
