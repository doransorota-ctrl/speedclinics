import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendNamedTemplate } from "@/lib/twilio/whatsapp";
import { formatDutchPhone } from "@/lib/phone";

const SALES_TEMPLATE = process.env.TEMPLATE_SALES_GREETING;
const GREETING_TEXT = process.env.SALES_GREETING_TEXT ||
  "Hoi, ik ben Doran van Speed Leads. Ik had je gebeld. Als jij niet opneemt stuurt m'n systeem de beller een appje en plant een afspraak in. Scheelt je gemiste klussen. 5 minuutjes bellen?";

/** POST — Bulk send WhatsApp outreach templates and create leads. */
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

    const { data: business } = await supabase
      .from("businesses")
      .select("id, prompt_mode, twilio_number, whatsapp_personal")
      .eq("owner_id", user.id)
      .single();

    if (!business) return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    if (business.prompt_mode !== "sales") return NextResponse.json({ error: "Alleen voor sales-mode" }, { status: 403 });
    if (!SALES_TEMPLATE) return NextResponse.json({ error: "Sales template niet geconfigureerd" }, { status: 500 });

    const body = await request.json();
    const contacts: Array<{ phone: string; name?: string }> = body.contacts;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "Geen contacten opgegeven" }, { status: 400 });
    }
    if (contacts.length > 200) {
      return NextResponse.json({ error: "Maximaal 200 contacten per batch" }, { status: 400 });
    }

    // Normalize phones and deduplicate within batch
    const seen = new Set<string>();
    const normalized = contacts.map((c) => ({
      phone: formatDutchPhone(c.phone),
      name: c.name?.trim() || null,
    })).filter((c) => {
      if (!c.phone || !c.phone.startsWith("+31")) return false;
      if (seen.has(c.phone)) return false;
      seen.add(c.phone);
      return true;
    });

    // Deduplicate against existing active leads
    const phones = normalized.map((c) => c.phone);
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("customer_phone")
      .eq("business_id", business.id)
      .in("customer_phone", phones)
      .in("status", ["active", "qualified", "appointment_set"]);

    const existingPhones = new Set(existingLeads?.map((l) => l.customer_phone) || []);
    const newContacts = normalized.filter((c) => !existingPhones.has(c.phone));
    const fromNumber = business.whatsapp_personal ? business.twilio_number : undefined;

    const results: Array<{ phone: string; name: string | null; status: string; leadId?: string }> = [];

    // Mark skipped
    for (const c of normalized) {
      if (existingPhones.has(c.phone)) {
        results.push({ phone: c.phone, name: c.name, status: "skipped" });
      }
    }

    // Send to new contacts with 100ms delay between each
    for (const contact of newContacts) {
      try {
        // 1. Create lead
        const { data: lead } = await supabase
          .from("leads")
          .insert({
            business_id: business.id,
            customer_phone: contact.phone,
            customer_name: contact.name,
            source: "manual",
            status: "active",
            conversation_mode: "ai",
          })
          .select("id")
          .single();

        if (!lead) {
          results.push({ phone: contact.phone, name: contact.name, status: "failed" });
          continue;
        }

        // 2. Send template
        const msg = await sendNamedTemplate(contact.phone, SALES_TEMPLATE, {}, fromNumber);

        // 3. Save message with twilio_sid
        await supabase.from("messages").insert({
          lead_id: lead.id,
          business_id: business.id,
          sender: "ai",
          body: GREETING_TEXT,
          twilio_sid: msg?.sid || null,
        });

        // 4. Create AI context
        await supabase.from("ai_contexts").insert({
          lead_id: lead.id,
          business_id: business.id,
          system_prompt: "",
          messages_json: [{ role: "assistant", content: GREETING_TEXT }],
          gathered_info: {},
          conversation_state: "greeting",
        });

        results.push({ phone: contact.phone, name: contact.name, status: "sent", leadId: lead.id });
      } catch (err) {
        console.error(`[Outreach] Failed for ***${contact.phone.slice(-4)}:`, err);
        results.push({ phone: contact.phone, name: contact.name, status: "failed" });
      }

      // Rate limit: 100ms between sends
      await new Promise((r) => setTimeout(r, 100));
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, skipped, failed, total: normalized.length, results });
  } catch (error) {
    console.error("[Outreach] Error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

/** GET — Fetch outreach lead statuses for the dashboard. */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!business) return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });

    // Fetch all leads for this business (outreach + missed calls from sales)
    const { data: leads } = await supabase
      .from("leads")
      .select("id, customer_phone, customer_name, status, created_at, source")
      .eq("business_id", business.id)
      .in("source", ["manual", "missed_call"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (!leads || leads.length === 0) return NextResponse.json([]);

    const leadIds = leads.map((l) => l.id);

    // Get first AI message per lead (for delivery status)
    const { data: aiMessages } = await supabase
      .from("messages")
      .select("lead_id, twilio_status")
      .in("lead_id", leadIds)
      .eq("sender", "ai")
      .order("created_at", { ascending: true });

    // Get customer response existence per lead
    const { data: customerMessages } = await supabase
      .from("messages")
      .select("lead_id")
      .in("lead_id", leadIds)
      .eq("sender", "customer");

    // Build lookup maps
    const deliveryMap = new Map<string, string>();
    for (const msg of aiMessages || []) {
      if (!deliveryMap.has(msg.lead_id)) {
        deliveryMap.set(msg.lead_id, msg.twilio_status || "sent");
      }
    }

    const respondedSet = new Set((customerMessages || []).map((m) => m.lead_id));

    // Enrich leads
    const enriched = leads.map((lead) => ({
      ...lead,
      delivery_status: deliveryMap.get(lead.id) || "unknown",
      has_response: respondedSet.has(lead.id),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("[Outreach] Status error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
