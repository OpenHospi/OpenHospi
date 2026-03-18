import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);

    return NextResponse.json({
      userId: session.user.id,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
