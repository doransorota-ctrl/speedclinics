import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendNamedTemplate } from "@/lib/twilio/whatsapp";
import { formatDutchPhone } from "@/lib/phone";

const SALES_TEMPLATE = process.env.TEMPLATE_SALES_GREETING;
const WEBSITE_TEMPLATE = process.env.TEMPLATE_WEBSITE_OUTREACH;

function greetingText(businessName: string) {
  return `Hey, Doran hier. Zag ${businessName} online. Ik heb een WhatsApp-tooltje gebouwd dat je gemiste bellers direct opvangt en inplant als jij op de klus staat. Scheelt je 's avonds weer onbetaald nabellen. Zal ik de demo-video (1 min) even appen?`;
}
function websiteGreetingText(businessName: string) {
  return `Hey, ik zag ${businessName} op Google maar je hebt nog geen website. Klanten die je Googelen en geen site vinden bellen vaak de concurrent. Ik maak websites speciaal voor vakmensen — in 5 dagen klaar. Zal ik een voorbeeld sturen?`;
}

/** POST — Send one outreach message: create lead + send template. */
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
    const { phone, name, campaignType } = await request.json();
    const isWebsite = campaignType === "website";
    const templateSid = isWebsite ? WEBSITE_TEMPLATE : SALES_TEMPLATE;
    if (!templateSid) return NextResponse.json({ error: `${isWebsite ? "Website" : "Sales"} template niet geconfigureerd` }, { status: 500 });
    if (!phone) return NextResponse.json({ error: "Geen telefoonnummer" }, { status: 400 });

    const normalized = formatDutchPhone(phone);
    if (!normalized || !normalized.startsWith("+31")) {
      return NextResponse.json({ error: "Ongeldig telefoonnummer" }, { status: 400 });
    }

    // Check if lead already exists
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_phone", normalized)
      .in("status", ["active", "qualified", "appointment_set"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: "skipped", reason: "already_exists" });
    }

    // Create lead
    const { data: lead } = await supabase
      .from("leads")
      .insert({
        business_id: business.id,
        customer_phone: normalized,
        customer_name: name?.trim() || null,
        source: "manual",
        status: "active",
        conversation_mode: "manual",
      })
      .select("id")
      .single();

    if (!lead) return NextResponse.json({ error: "Lead aanmaken mislukt" }, { status: 500 });

    // Send template with business name as variable
    const contactName = name?.trim() || "je bedrijf";
    const fromNumber = business.whatsapp_personal ? business.twilio_number : undefined;
    const msg = await sendNamedTemplate(normalized, templateSid, { "1": contactName }, fromNumber);

    // Save message — use actual sent body from Twilio if available, otherwise fallback
    const greeting = msg?.body || (isWebsite ? websiteGreetingText(contactName) : greetingText(contactName));
    await supabase.from("messages").insert({
      lead_id: lead.id,
      business_id: business.id,
      sender: "ai",
      body: greeting,
      twilio_sid: msg?.sid || null,
    });

    // Create AI context
    await supabase.from("ai_contexts").insert({
      lead_id: lead.id,
      business_id: business.id,
      system_prompt: "",
      messages_json: [{ role: "assistant", content: greeting }],
      gathered_info: {},
      conversation_state: "greeting",
    });

    return NextResponse.json({ status: "sent", leadId: lead.id });
  } catch (error) {
    console.error("[Outreach] Send-one error:", error);
    return NextResponse.json({ error: "Versturen mislukt" }, { status: 500 });
  }
}
