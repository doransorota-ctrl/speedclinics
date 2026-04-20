import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsApp, sendNamedTemplate, TEMPLATES } from "@/lib/twilio/whatsapp";
import { isValidCronSecret } from "@/lib/cron-auth";

export async function GET(req: Request) {
  if (!isValidCronSecret(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Get tomorrow's date range
  const now = new Date();
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Find all appointments for tomorrow
  const { data: leads, error } = await supabase
    .from("leads")
    .select(`
      id,
      customer_phone,
      customer_name,
      appointment_start,
      address,
      problem_summary,
      business_id,
      businesses (
        name,
        phone,
        whatsapp_personal,
        twilio_number
      )
    `)
    .eq("status", "appointment_set")
    .gte("appointment_start", tomorrowStart.toISOString())
    .lte("appointment_start", tomorrowEnd.toISOString());

  if (error) {
    console.error("[Cron/Reminders] Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  // Deduplicate: fetch reminders sent in the last 20 hours per lead
  const dedupWindow = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const leadIds = (leads || []).map((l) => l.id);
  const { data: recentReminderMsgs } = leadIds.length > 0
    ? await supabase
        .from("messages")
        .select("lead_id, body")
        .in("lead_id", leadIds)
        .eq("sender", "ai")
        .gte("created_at", dedupWindow)
        .like("body", "%herinnering%")
    : { data: [] };
  const alreadyReminded = new Set((recentReminderMsgs || []).map((m) => m.lead_id));

  for (const lead of leads || []) {
    // Skip if already reminded in the last 20h
    if (alreadyReminded.has(lead.id)) {
      skipped++;
      continue;
    }

    // Validate appointment_start — skip if malformed
    if (!lead.appointment_start) {
      console.warn(`[Cron/Reminders] Lead ${lead.id} has null appointment_start, skipping`);
      continue;
    }
    const apptDate = new Date(lead.appointment_start);
    if (isNaN(apptDate.getTime())) {
      console.warn(`[Cron/Reminders] Lead ${lead.id} has invalid appointment_start (${lead.appointment_start}), skipping`);
      continue;
    }

    const biz = (lead as Record<string, unknown>).businesses as { name: string; phone: string; whatsapp_personal?: boolean; twilio_number?: string } | null;
    const bizFrom = biz?.whatsapp_personal ? biz?.twilio_number : undefined;
    const apptTime = apptDate.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    });
    const customerName = lead.customer_name || "klant";

    // Send reminder to customer (business-initiated — use template)
    try {
      const customerMsg = `Hoi ${customerName}, even een herinnering: morgen om ${apptTime} bij ${biz?.name || "uw kliniek"}. Tot dan!`;
      if (TEMPLATES.APPOINTMENT_REMINDER) {
        await sendNamedTemplate(lead.customer_phone, TEMPLATES.APPOINTMENT_REMINDER, {
          "1": customerName,
          "2": apptTime,
          "3": biz?.name || "uw kliniek",
        }, bizFrom);
      } else {
        await sendWhatsApp(lead.customer_phone, customerMsg, bizFrom);
      }

      await supabase.from("messages").insert({
        lead_id: lead.id,
        business_id: lead.business_id,
        sender: "ai",
        body: customerMsg,
      });

      sent++;
    } catch (err) {
      console.error(`[Cron/Reminders] Failed to send reminder to customer ${lead.id}:`, err);
    }

    // Send reminder to owner (business-initiated — use template)
    if (biz?.phone) {
      try {
        if (TEMPLATES.OWNER_REMINDER) {
          await sendNamedTemplate(biz.phone, TEMPLATES.OWNER_REMINDER, {
            "1": apptTime,
            "2": customerName,
            "3": lead.address || "adres onbekend",
          }, bizFrom);
        } else {
          const ownerMsg = `Herinnering: morgen om ${apptTime} afspraak met ${customerName}${lead.address ? ` op ${lead.address}` : ""}.`;
          await sendWhatsApp(biz.phone, ownerMsg, bizFrom);
        }
      } catch (err) {
        console.error(`[Cron/Reminders] Failed to send reminder to owner for lead ${lead.id}:`, err);
      }
    }
  }

  console.log(`[Cron/Reminders] Sent ${sent} reminders, skipped ${skipped} duplicates for tomorrow`);
  return NextResponse.json({
    reminders_sent: sent,
    skipped_duplicates: skipped,
    total_appointments: leads?.length || 0,
  });
}
