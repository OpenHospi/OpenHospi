import { randomUUID } from "node:crypto";

import { createDrizzleSupabaseClient, db } from "@openhospi/database";
import { houseMembers, houses } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireApiSession, apiError } from "@/app/api/mobile/_lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);

    const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
      const membership = await tx.query.houseMembers.findFirst({
        where: { userId: session.user.id },
        columns: { role: true },
        with: {
          house: {
            columns: { id: true, name: true, inviteCode: true, createdAt: true },
            with: {
              members: {
                columns: { userId: true, role: true, joinedAt: true },
                with: {
                  user: {
                    columns: { firstName: true, lastName: true, avatarUrl: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!membership?.house) return null;

      return {
        house: membership.house,
        members: membership.house.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          avatarUrl: m.user.avatarUrl,
        })),
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
