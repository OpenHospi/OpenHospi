"use server";

import { requireSession } from "@/lib/auth/server";

/**
 * Generate a JWT for Supabase Realtime authentication.
 * The client uses this to subscribe to realtime channels.
 */
export async function getRealtimeToken() {
  const session = await requireSession();

  return {
    userId: session.user.id,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}
