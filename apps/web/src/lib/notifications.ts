import { db, withRLS } from "@openhospi/database";
import { notifications, profiles, pushTokens } from "@openhospi/database/schema";
import { NOTIFICATIONS_PER_PAGE } from "@openhospi/shared/constants";
import type { SupportedLocale } from "@openhospi/shared/constants";
import { getMessages } from "@openhospi/i18n/app";
import { and, count, desc, eq, isNull } from "drizzle-orm";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * Main notification function. Creates in-app notification + sends push if tokens exist.
 * Uses the recipient's preferred locale for text rendering.
 */
export async function notifyUser(
  userId: string,
  messageKey: string,
  params?: Record<string, string>,
) {
  // Look up user's preferred locale
  const [profile] = await db
    .select({ preferredLocale: profiles.preferredLocale })
    .from(profiles)
    .where(eq(profiles.id, userId));

  const locale = (profile?.preferredLocale ?? "nl") as SupportedLocale;
  const messages = await getMessages(locale);

  // Resolve notification text from i18n
  const titleKey = `${messageKey}.title`;
  const bodyKey = `${messageKey}.body`;
  const title = resolveMessageKey(messages, titleKey, params);
  const body = resolveMessageKey(messages, bodyKey, params);

  // Insert notification (uses db directly — owner role, bypasses RLS)
  await db.insert(notifications).values({
    userId,
    title,
    body,
    data: params ?? {},
  });

  // Send push notification if user has tokens
  const tokens = await db
    .select({ expoPushToken: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.active, true)));

  for (const token of tokens) {
    await sendPushNotification(token.expoPushToken, title, body, params);
  }

  // Mark as sent if push was attempted
  if (tokens.length > 0) {
    // The notification was just inserted — update the most recent one
    // This is fine for our use case since we just inserted it
  }
}

function resolveMessageKey(
  messages: Record<string, unknown>,
  key: string,
  params?: Record<string, string>,
): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key; // Fallback to key if not found
    }
  }
  if (typeof current !== "string") return key;

  // Replace {param} placeholders
  let result = current;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return result;
}

async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data,
        sound: "default",
      }),
    });
  } catch {
    // Push delivery is best-effort — don't fail the operation
  }
}

export async function getUserNotifications(userId: string, page = 1): Promise<NotificationItem[]> {
  return withRLS(userId, async (tx) => {
    return tx
      .select({
        id: notifications.id,
        title: notifications.title,
        body: notifications.body,
        data: notifications.data,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(NOTIFICATIONS_PER_PAGE)
      .offset((page - 1) * NOTIFICATIONS_PER_PAGE);
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return withRLS(userId, async (tx) => {
    const [result] = await tx
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return result?.count ?? 0;
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await withRLS(userId, async (tx) => {
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  });
}

export async function markAllNotificationsRead(userId: string) {
  await withRLS(userId, async (tx) => {
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  });
}
