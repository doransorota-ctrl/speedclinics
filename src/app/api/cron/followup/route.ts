import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsApp, sendNamedTemplate } from "@/lib/twilio/whatsapp";
import { isValidCronSecret } from "@/lib/cron-auth";

/**
 * Cron: Send a follow-up to leads who received a greeting but never responded.
 * Runs every hour. Only sends between 09:00-20:00.
 * Targets leads where the greeting was sent 4-24 hours ago with zero customer messages.
 */
export async function GET(req: Request) {
  if (!isValidCronSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only send follow-ups during normal hours (09:00-20:00 Amsterdam time)
  const now = new Date();
  const hour = now.getHours(); // Server TZ=Europe/Amsterdam on Railway
  if (hour < 9 || hour >= 20) {
    return NextResponse.json({ skipped: true, reason: "outside business hours" });
  }

  const supabase = createServiceRoleClient();

  // Find leads where:
  // - Status is "active" (greeting sent, no qualification yet)
  // - Created 4-24 hours ago
  // - Zero customer messages (only the AI greeting exists)
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(`
      id,
      customer_phone,
      business_id,
      businesses (
        name,
        prompt_mode,
        whatsapp_personal,
        twilio_number
      )
    `)
    .eq("status", "active")
    .in("conversation_mode", ["ai", "manual"])
    .gte("created_at", twentyFourHoursAgo)
    .lte("created_at", fourHoursAgo);

  if (error) {
    console.error("[Cron/Followup] Error fetching leads:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  let sent = 0;

  for (const lead of leads || []) {
    // Check if customer has sent any messages
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("sender", "customer");

    if ((count || 0) > 0) continue; // Customer already responded — skip

    // Check if we already sent a follow-up (more than 1 AI message = follow-up already sent)
    const { count: aiCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id)
      .eq("sender", "ai");

    if ((aiCount || 0) > 1) continue; // Follow-up already sent — skip

    const biz = (lead as Record<string, unknown>).businesses as {
      name: string;
      prompt_mode?: string;
      whatsapp_personal?: boolean;
      twilio_number?: string;
    } | null;

    const fromNumber = biz?.whatsapp_personal ? biz?.twilio_number : undefined;
    const isSales = biz?.prompt_mode === "sales";

    const SALES_FOLLOWUP_TEMPLATE = process.env.TEMPLATE_SALES_FOLLOWUP;
    const followupMsg = isSales
      ? "Hoi, had je mijn berichtje nog gezien? M'n systeem kost €79/m (geen contract). 1 gemiste klus terugpakken en het is al terugverdiend. Zal ik je morgen 5 min bellen of komt later beter uit?"
      : `Hoi, we zagen dat je had gebeld. Stuur gerust een berichtje als we je ergens mee kunnen helpen.`;

    try {
      let msg;
      if (isSales && SALES_FOLLOWUP_TEMPLATE) {
        msg = await sendNamedTemplate(lead.customer_phone, SALES_FOLLOWUP_TEMPLATE, {}, fromNumber);
      } else {
        msg = await sendWhatsApp(lead.customer_phone, followupMsg, fromNumber);
      }
      await supabase.from("messages").insert({
        lead_id: lead.id,
        business_id: lead.business_id,
        sender: "ai",
        body: msg?.body || followupMsg,
        twilio_sid: msg?.sid || null,
      });
      sent++;
    } catch (err) {
      console.error(`[Cron/Followup] Failed for lead ${lead.id}:`, err);
    }
  }

  console.log(`[Cron/Followup] Sent ${sent} follow-ups`);
  return NextResponse.json({ sent, checked: leads?.length || 0 });
}
