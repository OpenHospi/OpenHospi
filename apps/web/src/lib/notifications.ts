import { db, withRLS } from "@openhospi/database";
import { notifications, profiles } from "@openhospi/database/schema";
import { getMessages } from "@openhospi/i18n/app";
import { NOTIFICATIONS_PER_PAGE } from "@openhospi/shared/constants";
import type { SupportedLocale } from "@openhospi/shared/constants";
import { and, count, desc, eq, isNull } from "drizzle-orm";

import { sendWebPushToUser } from "./web-push";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * Main notification function. Resolves i18n text, inserts in-app notification,
 * and sends Web Push (best-effort).
 */
export async function notifyUser(
  userId: string,
  messageKey: string,
  params?: Record<string, string>,
) {
  const [profile] = await db
    .select({ preferredLocale: profiles.preferredLocale })
    .from(profiles)
    .where(eq(profiles.id, userId));

  const locale = (profile?.preferredLocale ?? "nl") as SupportedLocale;
  const messages = await getMessages(locale);

  const title = resolveMessageKey(messages, `${messageKey}.title`, params);
  const body = resolveMessageKey(messages, `${messageKey}.body`, params);

  // 1. Insert in-app notification
  await db.insert(notifications).values({
    userId,
    title,
    body,
    data: params ?? {},
  });

  // 2. Send Web Push (best-effort)
  try {
    await sendWebPushToUser(userId, { title, body });
  } catch {
    // Push delivery is best-effort — don't fail the operation
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
      result = result.replaceAll(`{${k}}`, v);
    }
  }
  return result;
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
