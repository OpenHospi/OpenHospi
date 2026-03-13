"use server";

import type { ApplyToRoomData } from "@openhospi/validators";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import { applyToRoomForUser } from "@/lib/services/application-mutations";

export async function applyToRoom(roomId: string, data: ApplyToRoomData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await applyToRoomForUser(session.user.id, roomId, data);

  if ("success" in result) {
    revalidatePath(`/discover/${roomId}`);
    revalidatePath("/applications");
  }

  return result;
}
