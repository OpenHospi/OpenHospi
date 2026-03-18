"use server";

import { and, eq } from "drizzle-orm";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import { db, createDrizzleSupabaseClient } from "@/lib/db";
import { activeConsents, pushSubscriptions } from "@/lib/db/schema";

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await requireSession();
  const userId = session.user.id;

  const restricted = await requireNotRestricted(userId);
  if (restricted) throw new Error(restricted.error);

  // Verify push_notifications consent (Art. 6)
  const [consent] = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({ granted: activeConsents.granted })
      .from(activeConsents)
      .where(
        and(eq(activeConsents.userId, userId), eq(activeConsents.purpose, "push_notifications")),
      )
      .limit(1),
  );
  if (!consent?.granted) {
    throw new Error("PUSH_CONSENT_REQUIRED");
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: [pushSubscriptions.endpoint],
      set: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
}

export async function unsubscribePush(endpoint: string) {
  await requireSession();

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
