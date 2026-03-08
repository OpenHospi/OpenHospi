import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { submitLanguagesStep } from "@/lib/services/onboarding-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const data = await request.json();
    const result = await submitLanguagesStep(session.user.id, data);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
