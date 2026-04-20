import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendNamedTemplate, TEMPLATES } from "@/lib/twilio/whatsapp";
import { isValidCronSecret } from "@/lib/cron-auth";

/**
 * Runs every hour — sends review requests to customers whose
 * appointments were completed 2-3 hours ago.
 */
export async function GET(req: Request) {
  if (!isValidCronSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!TEMPLATES.REVIEW_REQUEST) {
    return NextResponse.json({ skipped: true, reason: "TEMPLATE_REVIEW_REQUEST not configured" });
  }

  const supabase = createServiceRoleClient();

  // Find appointments that ended 2-3 hours ago
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(`
      id,
      customer_phone,
      customer_name,
      business_id,
      appointment_end,
      status,
      businesses (
        name,
        google_review_link,
        whatsapp_personal,
        twilio_number
      )
    `)
    // Include both 'converted' (status auto-updated) and 'appointment_set' (customer never messaged back)
    .in("status", ["converted", "appointment_set"])
    .gte("appointment_end", threeHoursAgo)
    .lte("appointment_end", twoHoursAgo)
    .not("appointment_end", "is", null);

  if (error) {
    console.error("[Cron/Reviews] Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }

  let sent = 0;

  for (const lead of leads || []) {
    const biz = (lead as Record<string, unknown>).businesses as { name: string; google_review_link: string | null; whatsapp_personal?: boolean; twilio_number?: string } | null;
    const bizFrom = biz?.whatsapp_personal ? biz?.twilio_number : undefined;

    // Skip if no review link configured
    if (!biz?.google_review_link) continue;

    // Check if we already sent a review request for this lead
    const { data: existingReview } = await supabase
      .from("messages")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("sender", "ai")
      .ilike("body", "%review%")
      .limit(1)
      .maybeSingle();

    if (existingReview) continue; // Already sent

    // If still appointment_set, convert it now (customer didn't message back after appointment)
    if (lead.status === "appointment_set") {
      await supabase
        .from("leads")
        .update({ status: "converted", conversation_mode: "manual" })
        .eq("id", lead.id);
    }

    const customerName = lead.customer_name || "klant";

    try {
      await sendNamedTemplate(lead.customer_phone, TEMPLATES.REVIEW_REQUEST!, {
        "1": customerName,
        "2": biz.name,
        "3": lead.business_id,
      }, bizFrom);

      // Save to messages table for tracking
      await supabase.from("messages").insert({
        lead_id: lead.id,
        business_id: lead.business_id,
        sender: "ai",
        body: `Hoi ${customerName}, bedankt voor je afspraak met ${biz.name}. We horen graag hoe het was! Je kunt een review achterlaten via: ${biz.google_review_link} Alvast bedankt!`,
      });

      sent++;
    } catch (err) {
      console.error(`[Cron/Reviews] Failed to send review request for lead ${lead.id}:`, err);
    }
  }

  console.log(`[Cron/Reviews] Sent ${sent} review requests`);
  return NextResponse.json({ sent, total: leads?.length || 0 });
}
