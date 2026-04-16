import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isValidCronSecret } from "@/lib/cron-auth";

const AUTO_RESUME_MINUTES = 20;

export async function GET(req: Request) {
  if (!isValidCronSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - AUTO_RESUME_MINUTES * 60 * 1000).toISOString();

  // Find leads in manual mode older than 20 min that are still active
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, manual_mode_at")
    .eq("conversation_mode", "manual")
    .in("status", ["active", "qualified"])
    .not("manual_mode_at", "is", null)
    .lt("manual_mode_at", cutoff);

  if (error) {
    console.error("[Cron/AutoResume] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  let resumed = 0;
  for (const lead of leads || []) {
    // Only resume if owner hasn't sent a message since manual_mode_at
    const { data: ownerMsg } = await supabase
      .from("messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("sender", "owner")
      .gte("created_at", lead.manual_mode_at!)
      .limit(1)
      .maybeSingle();

    if (!ownerMsg) {
      await supabase
        .from("leads")
        .update({ conversation_mode: "ai", manual_mode_at: null })
        .eq("id", lead.id);
      resumed++;
      console.log(`[Cron/AutoResume] Resumed AI for lead ${lead.id}`);
    }
  }

  console.log(`[Cron/AutoResume] Resumed ${resumed} of ${leads?.length || 0} stale manual leads`);
  return NextResponse.json({ resumed, checked: leads?.length || 0 });
}
