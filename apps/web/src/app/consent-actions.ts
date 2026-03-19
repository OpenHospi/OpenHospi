"use server";

import { db } from "@openhospi/database";
import { activeConsents, consentRecords } from "@openhospi/database/schema";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import type { ConsentPurpose, LegalBasis } from "@openhospi/shared/enums";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { getSession } from "@/lib/auth/server";

type ConsentEntry = {
  purpose: ConsentPurpose;
  granted: boolean;
  legalBasis: LegalBasis;
};

export async function recordConsent(consents: ConsentEntry[]) {
  const session = await getSession();
  if (!session) return { error: "notAuthenticated" as const };

  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  await db.transaction(async (tx) => {
    for (const entry of consents) {
      await tx.insert(consentRecords).values({
        userId: session.user.id,
        purpose: entry.purpose,
        granted: entry.granted,
        legalBasis: entry.legalBasis,
        ipAddress,
        userAgent,
        version: PRIVACY_POLICY_VERSION,
      });

      await tx
        .insert(activeConsents)
        .values({
          userId: session.user.id,
          purpose: entry.purpose,
          granted: entry.granted,
        })
        .onConflictDoUpdate({
          target: [activeConsents.userId, activeConsents.purpose],
          set: { granted: entry.granted, lastUpdatedAt: new Date() },
        });
    }
  });

  return { success: true };
}

export async function migrateGuestConsent(consents: ConsentEntry[]) {
  const session = await getSession();
  if (!session) return;

  // Check if user already has consent records
  const existing = await db
    .select({ purpose: activeConsents.purpose })
    .from(activeConsents)
    .where(eq(activeConsents.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) return;

  await recordConsent(consents);
}
