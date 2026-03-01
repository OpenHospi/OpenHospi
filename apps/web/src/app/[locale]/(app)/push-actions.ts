"use server";

import { db } from "@openhospi/database";
import { pushSubscriptions } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
