import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Find invitations for uncancelled events starting within 24 hours
  // where reminder hasn't been sent and invitee hasn't declined
  const { data: invitations, error } = await supabase
    .from("hospi_invitations")
    .select(`
      id,
      user_id,
      hospi_events!inner (
        title,
        event_date,
        time_start,
        cancelled_at
      )
    `)
    .is("reminder_sent_at", null)
    .neq("status", "not_attending")
    .is("hospi_events.cancelled_at", null)
    .filter(
      "hospi_events.event_date",
      "gte",
      new Date().toISOString().split("T")[0],
    )
    .filter(
      "hospi_events.event_date",
      "lte",
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  for (const inv of invitations ?? []) {
    const event = inv.hospi_events as unknown as {
      title: string;
      event_date: string;
      time_start: string;
    };

    // Call send-notification edge function
    try {
      await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userId: inv.user_id,
          title: "Hospi Reminder",
          body: `Your hospi event "${event.title}" is coming up at ${event.event_date} ${event.time_start}`,
          data: {
            eventTitle: event.title,
            time: `${event.event_date} ${event.time_start}`,
          },
        }),
      });
    } catch {
      // Best-effort delivery
      continue;
    }

    // Mark reminder as sent
    await supabase
      .from("hospi_invitations")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", inv.id);

    sent++;
  }

  return Response.json({ sent });
});
