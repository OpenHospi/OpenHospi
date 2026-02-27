import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, title, body, data } = await req.json();
  if (!userId || !title || !body) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Insert in-app notification
  const { error: insertError } = await supabase
    .from("notifications")
    .insert({ user_id: userId, title, body, data: data ?? {} });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // Fetch active push tokens
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId)
    .eq("active", true);

  // Send push notifications via Expo
  if (tokens && tokens.length > 0) {
    const messages = tokens.map((t: { expo_push_token: string }) => ({
      to: t.expo_push_token,
      title,
      body,
      data,
      sound: "default",
    }));

    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
    } catch {
      // Push delivery is best-effort
    }
  }

  return Response.json({ success: true });
});
