import { type NextRequest, NextResponse } from "next/server";

import { db } from "@openhospi/database";
import { houseMembers, houses } from "@openhospi/database/schema";
import { HouseMemberRole } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";

import { requireApiSession, apiError } from "@/app/api/mobile/_lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireApiSession(request);
    const { code } = await params;

    const [house] = await db
      .select({ id: houses.id, name: houses.name })
      .from(houses)
      .where(eq(houses.inviteCode, code));

    if (!house) {
      return apiError("House not found", 404);
    }

    return NextResponse.json({ house });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { code } = await params;

    const [house] = await db
      .select({ id: houses.id, name: houses.name })
      .from(houses)
      .where(eq(houses.inviteCode, code));

    if (!house) {
      return apiError("House not found", 404);
    }

    // Check if already a member
    const [existing] = await db
      .select({ id: houseMembers.id })
      .from(houseMembers)
      .where(and(eq(houseMembers.houseId, house.id), eq(houseMembers.userId, session.user.id)));

    if (existing) {
      return apiError("Already a member", 409);
    }

    // Insert directly (RLS blocks non-creator inserts to house_members)
    await db.insert(houseMembers).values({
      houseId: house.id,
      userId: session.user.id,
      role: HouseMemberRole.member,
    });

    return NextResponse.json({ house }, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
