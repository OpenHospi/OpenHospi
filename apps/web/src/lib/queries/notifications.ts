import { db, createDrizzleSupabaseClient } from "@/lib/db";
import { notifications, profiles } from "@/lib/db/schema";
import type { EmailTemplateName, TemplatePropsMap } from "@openhospi/email";
import type { Locale } from "@openhospi/i18n";
import { getMessages } from "@openhospi/i18n/web";
import { NOTIFICATIONS_PER_PAGE } from "@openhospi/shared/constants";
import { and, count, desc, eq, isNull } from "drizzle-orm";

import { sendTemplatedEmail } from "@/lib/services/email";
import { sendWebPushToUser } from "@/lib/services/web-push";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data: unknown;
  readAt: Date | null;
  createdAt: Date;
};

type NotifyOptions = {
  email?: {
    template: EmailTemplateName;
    props: TemplatePropsMap[EmailTemplateName];
  };
};

/**
 * Main notification function. Resolves i18n text, inserts in-app notification,
 * sends Web Push (best-effort), and optionally sends email.
 */
export async function notifyUser(
  userId: string,
  messageKey: string,
  params?: Record<string, string>,
  options?: NotifyOptions,
) {
  const [profile] = await db
    .select({
      preferredLocale: profiles.preferredLocale,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.id, userId));

  const locale = (profile?.preferredLocale ?? "nl") as Locale;
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

  // 3. Send email (best-effort)
  if (options?.email && profile?.email) {
    try {
      await sendTemplatedEmail(profile.email, options.email.template, options.email.props, locale);
    } catch {
      // Email delivery is best-effort — don't fail the operation
    }
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
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
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
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [result] = await tx
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return result?.count ?? 0;
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  });
}

export async function markAllNotificationsRead(userId: string) {
  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  });
}
