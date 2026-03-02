"use server";

import { withRLS } from "@openhospi/database";
import { applications, rooms } from "@openhospi/database/schema";
import {
  ApplicationStatus,
  isTerminalApplicationStatus,
  RoomStatus,
} from "@openhospi/shared/enums";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { logStatusTransition } from "@/lib/application-history";
import { requireNotRestricted, requireRoomOwnership, requireSession } from "@/lib/auth-server";
import { notifyUser } from "@/lib/notifications";

export async function closeRoomWithChoice(roomId: string, chosenApplicationId?: string) {
  const { user } = await requireSession();
  const restricted = await requireNotRestricted(user.id);
  if (restricted) throw new Error(restricted.error);

  await requireRoomOwnership(roomId, user.id);

  const roomTitle = await withRLS(user.id, async (tx) => {
    const [room] = await tx
      .select({ title: rooms.title, status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (!room || room.status === RoomStatus.closed) {
      throw new Error("Room not found or already closed");
    }

    // Get all non-terminal applications
    const activeApps = await tx
      .select({
        id: applications.id,
        userId: applications.userId,
        status: applications.status,
      })
      .from(applications)
      .where(eq(applications.roomId, roomId));

    const nonTerminalApps = activeApps.filter(
      (a) => !isTerminalApplicationStatus(a.status as ApplicationStatus),
    );

    // If a chosen applicant is specified, set them to accepted
    if (chosenApplicationId) {
      const chosenApp = nonTerminalApps.find((a) => a.id === chosenApplicationId);
      await tx
        .update(applications)
        .set({ status: ApplicationStatus.accepted })
        .where(and(eq(applications.id, chosenApplicationId), eq(applications.roomId, roomId)));
      if (chosenApp) {
        await logStatusTransition(
          tx,
          chosenApplicationId,
          chosenApp.status as ApplicationStatus,
          ApplicationStatus.accepted,
          user.id,
        );
      }
    }

    // Set all other non-terminal applications to not_chosen
    for (const app of nonTerminalApps) {
      if (app.id === chosenApplicationId) continue;
      await tx
        .update(applications)
        .set({ status: ApplicationStatus.not_chosen })
        .where(eq(applications.id, app.id));
      await logStatusTransition(
        tx,
        app.id,
        app.status as ApplicationStatus,
        ApplicationStatus.not_chosen,
        user.id,
      );
    }

    // Close the room
    await tx.update(rooms).set({ status: RoomStatus.closed }).where(eq(rooms.id, roomId));

    return room.title;
  });

  // Send notifications outside the RLS transaction (uses db directly)
  const allApps = await withRLS(user.id, async (tx) => {
    return tx
      .select({ id: applications.id, userId: applications.userId })
      .from(applications)
      .where(
        and(eq(applications.roomId, roomId), ne(applications.status, ApplicationStatus.withdrawn)),
      );
  });

  for (const app of allApps) {
    if (chosenApplicationId && app.id === chosenApplicationId) {
      await notifyUser(app.userId, "notifications.accepted", { roomTitle });
    } else {
      await notifyUser(app.userId, "notifications.notChosen", { roomTitle });
    }
  }

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/my-rooms");
}
