"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/queries/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession();
  await markNotificationRead(notificationId, session.user.id);
  revalidatePath("/notifications");
}

export async function markAllReadAction() {
  const session = await requireSession();
  await markAllNotificationsRead(session.user.id);
  revalidatePath("/notifications");
}
