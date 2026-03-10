import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getPublicKeysByUserIds } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as { userIds?: string[] };

    if (!Array.isArray(body.userIds) || body.userIds.length === 0) {
      return apiError("userIds must be a non-empty array", 400);
    }

    const keys = await getPublicKeysByUserIds(session.user.id, body.userIds);
    return NextResponse.json(keys);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
