import { mintSupabaseJWT } from "@openhospi/supabase/jwt";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await mintSupabaseJWT(session.user.id);
  return Response.json({ token });
}
