import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RETENTION_SESSION_IP_DAYS = 30;
const RETENTION_EXPIRED_SESSION_DAYS = 90;
const RETENTION_REPORT_MESSAGE_TEXT_DAYS = 90;
const RETENTION_READ_NOTIFICATION_DAYS = 180;
const RETENTION_CONSENT_IP_DAYS = 365;

Deno.serve(async (req) => {
  // Verify the request is from Supabase cron (Authorization header)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const results: Record<string, number> = {};

  // 1. Null session IP addresses older than 30 days post-expiry
  const sessionIpCutoff = new Date(now.getTime() - RETENTION_SESSION_IP_DAYS * 86400000);
  const { count: sessionIps } = await supabase
    .from("session")
    .update({ ip_address: null })
    .lt("expires_at", sessionIpCutoff.toISOString())
    .not("ip_address", "is", null)
    .select("*", { count: "exact", head: true });
  results.sessionIpsNulled = sessionIps ?? 0;

  // 2. Delete expired sessions older than 90 days
  const expiredSessionCutoff = new Date(
    now.getTime() - RETENTION_EXPIRED_SESSION_DAYS * 86400000,
  );
  const { count: expiredSessions } = await supabase
    .from("session")
    .delete()
    .lt("expires_at", expiredSessionCutoff.toISOString())
    .select("*", { count: "exact", head: true });
  results.expiredSessionsDeleted = expiredSessions ?? 0;

  // 3. Null decrypted message text in resolved reports after 90 days
  const reportTextCutoff = new Date(
    now.getTime() - RETENTION_REPORT_MESSAGE_TEXT_DAYS * 86400000,
  );
  const { count: reportTexts } = await supabase
    .from("reports")
    .update({ decrypted_message_text: null })
    .not("resolved_at", "is", null)
    .lt("resolved_at", reportTextCutoff.toISOString())
    .not("decrypted_message_text", "is", null)
    .select("*", { count: "exact", head: true });
  results.reportTextsNulled = reportTexts ?? 0;

  // 4. Delete read notifications older than 180 days
  const notificationCutoff = new Date(
    now.getTime() - RETENTION_READ_NOTIFICATION_DAYS * 86400000,
  );
  const { count: readNotifications } = await supabase
    .from("notifications")
    .delete()
    .not("read_at", "is", null)
    .lt("created_at", notificationCutoff.toISOString())
    .select("*", { count: "exact", head: true });
  results.readNotificationsDeleted = readNotifications ?? 0;

  // 5. Delete expired verifications immediately
  const { count: expiredVerifications } = await supabase
    .from("verification")
    .delete()
    .lt("expires_at", now.toISOString())
    .select("*", { count: "exact", head: true });
  results.expiredVerificationsDeleted = expiredVerifications ?? 0;

  // 6. Null consent record IP addresses older than 365 days
  const consentIpCutoff = new Date(
    now.getTime() - RETENTION_CONSENT_IP_DAYS * 86400000,
  );
  const { count: consentIps } = await supabase
    .from("consent_records")
    .update({ ip_address: null })
    .lt("created_at", consentIpCutoff.toISOString())
    .not("ip_address", "is", null)
    .select("*", { count: "exact", head: true });
  results.consentIpsNulled = consentIps ?? 0;

  console.log("Data retention cleanup completed:", results);

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
