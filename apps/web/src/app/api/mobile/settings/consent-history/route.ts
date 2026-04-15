import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getConsentHistoryForUser } from "@/lib/services/settings-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const history = await getConsentHistoryForUser(session.user.id);
    return NextResponse.json(history);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
