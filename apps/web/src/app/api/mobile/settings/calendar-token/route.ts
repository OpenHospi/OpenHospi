import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import {
  getCalendarTokenForUser,
  regenerateCalendarTokenForUser,
} from "@/lib/services/settings-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const token = await getCalendarTokenForUser(session.user.id);
    return NextResponse.json({ token });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const token = await regenerateCalendarTokenForUser(session.user.id);
    return NextResponse.json({ token });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
