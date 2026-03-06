import { db } from "@openhospi/database";
import { pushSubscriptions } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  setVapidDetails(
    "mailto:info@openhospi.nl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigured = true;
}

export async function sendWebPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  ensureVapid();

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const results = await Promise.allSettled(
    subs.map((sub) =>
      sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ),
    ),
  );

  // Clean up expired/invalid subscriptions (410 Gone)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected" && result.reason?.statusCode === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subs[i].id));
    }
  }
}
