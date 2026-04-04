import { randomUUID } from "node:crypto";

import { createDrizzleSupabaseClient, db } from "@openhospi/database";
import { houseMembers, houses, profiles } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireApiSession, apiError } from "@/app/api/mobile/_lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);

    const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
      // Find the user's house membership
      const [membership] = await tx
        .select({
          houseId: houseMembers.houseId,
          role: houseMembers.role,
        })
        .from(houseMembers)
        .where(eq(houseMembers.userId, session.user.id))
        .limit(1);

      if (!membership) return null;

      // Get house details
      const [house] = await tx
        .select({
          id: houses.id,
          name: houses.name,
          inviteCode: houses.inviteCode,
          createdAt: houses.createdAt,
        })
        .from(houses)
        .where(eq(houses.id, membership.houseId));

      if (!house) return null;

      // Get all members with profile info
      const members = await tx
        .select({
          userId: houseMembers.userId,
          role: houseMembers.role,
          joinedAt: houseMembers.joinedAt,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(houseMembers)
        .innerJoin(profiles, eq(houseMembers.userId, profiles.id))
        .where(eq(houseMembers.houseId, house.id));

      return {
        house: {
          id: house.id,
          name: house.name,
          inviteCode: house.inviteCode,
          createdAt: house.createdAt,
        },
        members,
        currentUserRole: membership.role,
      };
    });

    if (!result) {
      return NextResponse.json({ house: null, members: [], currentUserRole: null });
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { action } = (await request.json()) as { action: string };

    if (action === "regenerate-invite-code") {
      // Find user's house where they are owner
      const [membership] = await db
        .select({ houseId: houseMembers.houseId, role: houseMembers.role })
        .from(houseMembers)
        .where(eq(houseMembers.userId, session.user.id))
        .limit(1);

      if (!membership || membership.role !== "owner") {
        return apiError("Not authorized", 403);
      }

      const newCode = randomUUID();
      await db.update(houses).set({ inviteCode: newCode }).where(eq(houses.id, membership.houseId));

      return NextResponse.json({ inviteCode: newCode });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
