import { HouseMemberRole } from "@openhospi/shared/enums";
import { and, count, eq } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { houseMembers, houses, rooms } from "@/lib/db/schema";

export type OwnerHouse = {
  id: string;
  name: string;
  roomCount: number;
};

export async function getUserOwnerHouses(userId: string): Promise<OwnerHouse[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const rows = await tx
      .select({
        id: houses.id,
        name: houses.name,
        roomCount: count(rooms.id),
      })
      .from(houseMembers)
      .innerJoin(houses, eq(houseMembers.houseId, houses.id))
      .leftJoin(rooms, eq(rooms.houseId, houses.id))
      .where(and(eq(houseMembers.userId, userId), eq(houseMembers.role, HouseMemberRole.owner)))
      .groupBy(houses.id, houses.name);

    return rows;
  });
}
