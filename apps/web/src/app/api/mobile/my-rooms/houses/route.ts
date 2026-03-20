import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { getUserOwnerHouses } from "@/lib/queries/houses";
import { createHouseAndDraft } from "@/lib/services/room-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const houses = await getUserOwnerHouses(session.user.id);
    return NextResponse.json({ houses });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { name } = (await request.json()) as { name: string };
    const result = await createHouseAndDraft(session.user.id, name);
    if ("error" in result) {
      const status = result.error === CommonError.rate_limited ? 429 : 422;
      return apiError(result.error, status);
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
