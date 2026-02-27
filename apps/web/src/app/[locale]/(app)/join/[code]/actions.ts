"use server";

import { db } from "@openhospi/database";
import { houseMembers, houses } from "@openhospi/database/schema";
import { HouseMemberRole } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";

type JoinResult = { success: true } | { error: "INVALID_LINK" | "ALREADY_MEMBER" };

export async function joinHouse(inviteCode: string): Promise<JoinResult> {
  const session = await requireSession();
  const userId = session.user.id;

  // Uses db directly — the house_members_insert RLS policy only allows
  // the house creator to insert. The joining user is NOT the creator,
  // so RLS would block it. Using db is safe because we validate the invite code.
  return db.transaction(async (tx) => {
    const [house] = await tx
      .select({ id: houses.id })
      .from(houses)
      .where(eq(houses.inviteCode, inviteCode));

    if (!house) return { error: "INVALID_LINK" };

    const [existing] = await tx
      .select({ id: houseMembers.id })
      .from(houseMembers)
      .where(and(eq(houseMembers.houseId, house.id), eq(houseMembers.userId, userId)));

    if (existing) return { error: "ALREADY_MEMBER" };

    await tx.insert(houseMembers).values({
      houseId: house.id,
      userId,
      role: HouseMemberRole.member,
    });

    revalidatePath("/my-house");
    return { success: true };
  });
}
