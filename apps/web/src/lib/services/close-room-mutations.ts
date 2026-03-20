import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applications, rooms } from "@openhospi/database/schema";
import {
  ApplicationStatus,
  isTerminalApplicationStatus,
  RoomStatus,
} from "@openhospi/shared/enums";
import { and, eq, ne } from "drizzle-orm";

import { requireRoomOwnership } from "@/lib/auth/server";
import { logStatusTransition } from "@/lib/queries/application-history";
import { notifyUser } from "@/lib/queries/notifications";

export async function closeRoomWithChoiceForUser(
  userId: string,
  roomId: string,
  chosenApplicationId?: string,
) {
  await requireRoomOwnership(roomId, userId);

  const roomTitle = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [room] = await tx
      .select({ title: rooms.title, status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (!room || room.status === RoomStatus.closed) {
      throw new Error("Room not found or already closed");
    }

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
          userId,
        );
      }
    }

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
        userId,
      );
    }

    await tx.update(rooms).set({ status: RoomStatus.closed }).where(eq(rooms.id, roomId));

    return room.title;
  });

  // Send notifications outside the RLS transaction
  const allApps = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
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

  return { success: true };
}
