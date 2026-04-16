import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidCronSecret } from "@/lib/cron-auth";

export async function GET(req: Request) {
  if (!isValidCronSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // 1. Mark past appointments as "converted"
  const { data: convertedLeads, error: convertError } = await supabase
    .from("leads")
    .update({ status: "converted", conversation_mode: "manual" })
    .eq("status", "appointment_set")
    .lt("appointment_end", now)
    .select("id");

  if (convertError) {
    console.error("[Cron/Cleanup] Error converting past appointments:", convertError);
  } else {
    console.log(`[Cron/Cleanup] Converted ${convertedLeads?.length || 0} past appointments`);
  }

  // 2. Archive stale active leads (no customer message in 48h)
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: staleLeads, error: staleError } = await supabase
    .from("leads")
    .update({ status: "lost" })
    .in("status", ["active", "qualified"])
    .lt("created_at", fortyEightHoursAgo)
    .select("id");

  if (staleError) {
    console.error("[Cron/Cleanup] Error archiving stale leads:", staleError);
  } else {
    console.log(`[Cron/Cleanup] Archived ${staleLeads?.length || 0} stale leads`);
  }

  // 3. Delete lost/archived leads older than 30 days (and their messages + ai_contexts)
  let deleted = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: oldLeads, error: oldError } = await supabase
    .from("leads")
    .select("id")
    .in("status", ["lost", "archived"])
    .lt("updated_at", thirtyDaysAgo);

  if (oldError) {
    console.error("[Cron/Cleanup] Error finding old leads:", oldError);
  } else if (oldLeads && oldLeads.length > 0) {
    const ids = oldLeads.map((l) => l.id);
    await supabase.from("messages").delete().in("lead_id", ids);
    await supabase.from("ai_contexts").delete().in("lead_id", ids);
    await supabase.from("leads").delete().in("id", ids);
    deleted = ids.length;
    console.log(`[Cron/Cleanup] Deleted ${deleted} old lost/archived leads`);
  }

  return NextResponse.json({
    converted: convertedLeads?.length || 0,
    archived: staleLeads?.length || 0,
    deleted,
  });
}
