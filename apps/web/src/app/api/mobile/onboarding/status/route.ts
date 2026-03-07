import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getOnboardingStatus } from "@/lib/services/onboarding-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const status = await getOnboardingStatus(session.user.id);
    return NextResponse.json(status);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
