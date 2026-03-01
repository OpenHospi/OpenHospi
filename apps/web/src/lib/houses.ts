import { withRLS } from "@openhospi/database";
import { houseMembers, houses, rooms } from "@openhospi/database/schema";
import { HouseMemberRole } from "@openhospi/shared/enums";
import { and, count, eq } from "drizzle-orm";

export type OwnerHouse = {
  id: string;
  name: string;
  roomCount: number;
};

export async function getUserOwnerHouses(userId: string): Promise<OwnerHouse[]> {
  return withRLS(userId, async (tx) => {
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
