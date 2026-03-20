"use server";

import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import { closeRoomWithChoiceForUser } from "@/lib/services/close-room-mutations";

export async function closeRoomWithChoice(roomId: string, chosenApplicationId?: string) {
  const { user } = await requireSession();
  const restricted = await requireNotRestricted(user.id);
  if (restricted) throw new Error(restricted.error);

  await closeRoomWithChoiceForUser(user.id, roomId, chosenApplicationId);

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/my-rooms");
}
