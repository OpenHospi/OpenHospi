"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { applications, rooms } from "@/lib/db/schema";
import {
  ApplicationStatus,
  isTerminalApplicationStatus,
  RoomStatus,
} from "@openhospi/shared/enums";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireRoomOwnership, requireSession } from "@/lib/auth/server";
import { logStatusTransition } from "@/lib/queries/application-history";
import { notifyUser } from "@/lib/queries/notifications";

export async function closeRoomWithChoice(roomId: string, chosenApplicationId?: string) {
  const { user } = await requireSession();
  const restricted = await requireNotRestricted(user.id);
  if (restricted) throw new Error(restricted.error);

  await requireRoomOwnership(roomId, user.id);

  const roomTitle = await createDrizzleSupabaseClient(user.id).rls(async (tx) => {
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
  const allApps = await createDrizzleSupabaseClient(user.id).rls(async (tx) => {
    return tx
      .select({ id: applications.id, userId: applications.userId })
      .from(applications)
      .where(
        and(eq(applications.roomId, roomId), ne(applications.status, ApplicationStatus.withdrawn)),
      );
  });

  const roomUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/rooms/${roomId}`;

  for (const app of allApps) {
    if (chosenApplicationId && app.id === chosenApplicationId) {
      await notifyUser(
        app.userId,
        "notifications.accepted",
        { roomTitle },
        {
          email: {
            template: "applicationAccepted",
            props: { roomTitle, roomUrl },
          },
        },
      );
    } else {
      await notifyUser(
        app.userId,
        "notifications.notChosen",
        { roomTitle },
        {
          email: {
            template: "applicationNotChosen",
            props: { roomTitle },
          },
        },
      );
    }
  }

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/my-rooms");
}
