import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getUserApplications } from "@/lib/queries/applications";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const applications = await getUserApplications(session.user.id);
    return NextResponse.json(applications);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
