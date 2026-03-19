import { db } from "@openhospi/database";
import { pushTokens } from "@openhospi/database/schema";
import { and, eq } from "drizzle-orm";
import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendExpoPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  const tokens = await db
    .select({ id: pushTokens.id, expoPushToken: pushTokens.expoPushToken })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.active, true)));

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.expoPushToken))
    .map((t) => ({
      to: t.expoPushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: "default" as const,
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        const token = tokens.find((t) => t.expoPushToken === (chunk[i] as { to: string }).to);
        if (token) {
          await db.update(pushTokens).set({ active: false }).where(eq(pushTokens.id, token.id));
        }
      }
    }
  }
}
