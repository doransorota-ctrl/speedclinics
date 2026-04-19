import { createServiceRoleClient } from "@/lib/supabase/server";
import { missedCallTwiml } from "@/lib/twilio/voice";
import { sendWhatsApp, sendNamedTemplate, TEMPLATES } from "@/lib/twilio/whatsapp";
import { verifyTwilioWebhook, formDataToParams } from "@/lib/twilio/verify-webhook";
import { formatDutchPhone } from "@/lib/phone";

/**
 * Twilio voice webhook — fires when a call arrives at a Clŷniq number.
 * This happens when a customer calls the tradesperson and the call forwards.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Verify request is from Twilio
    const params = formDataToParams(formData);
    if (!verifyTwilioWebhook(request, params, "/api/twilio/voice/incoming")) {
      return new Response("Forbidden", { status: 403 });
    }

    const to = formData.get("To") as string;
    const from = formData.get("From") as string; // Caller's number
    const callSid = formData.get("CallSid") as string;
    const forwardedFrom = formData.get("ForwardedFrom") as string | null;

    const VOICE_NUMBER = process.env.TWILIO_VOICE_NUMBER;
    const supabase = createServiceRoleClient();
    const selectFields = "id, name, trade, service_area, speed_leads_active, is_active, phone, email, status, subscription_ends_at, prompt_mode, twilio_number";

    let business = null;

    // Primary: identify business by the forwarding number (owner's personal phone)
    if (forwardedFrom) {
      const normalized = formatDutchPhone(forwardedFrom);
      const { data } = await supabase
        .from("businesses")
        .select(selectFields)
        .eq("phone", normalized)
        .limit(1)
        .maybeSingle();
      business = data;
    }

    // Fallback: match by dedicated twilio_number (future pro feature)
    if (!business) {
      const { data } = await supabase
        .from("businesses")
        .select(selectFields)
        .eq("twilio_number", to)
        .maybeSingle();
      business = data;
    }

    if (!business) {
      console.error(`[Voice] No business found — ForwardedFrom=***${forwardedFrom?.slice(-4) ?? "none"}, To=***${to?.slice(-4)}, From=***${from?.slice(-4)}`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Laura-Neural">
    Sorry, we konden uw oproep niet doorverbinden. Probeer het later opnieuw.
  </Say>
  <Hangup/>
</Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ─── Test call detection ───
    // If the caller is our shared VOICE_NUMBER, this is a forwarding test — not a real customer.
    if (VOICE_NUMBER && from === VOICE_NUMBER) {
      console.log(`[Voice] Test call detected for business ${business.id}`);
      // Send confirmation WhatsApp to business owner
      sendWhatsApp(
        business.phone,
        "Je doorschakeling werkt! Gemiste oproepen worden nu automatisch opgevangen door Clŷniq."
      ).catch((err) => console.error("[Voice] Test confirmation WhatsApp failed:", err));

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Check if service period has expired
    if (
      (business.status === "trialing" || business.status === "cancelled") &&
      business.subscription_ends_at &&
      new Date(business.subscription_ends_at) < new Date()
    ) {
      await supabase
        .from("businesses")
        .update({ speed_leads_active: false })
        .eq("id", business.id);
      console.log(`[Voice] Service period expired for business ${business.id} (status: ${business.status})`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Check if Clŷniq is active
    if (!business.speed_leads_active || !business.is_active) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ─── Anonymous/withheld caller handling ───
    if (!from || from === "anonymous" || from === "+0000" || from.length < 8) {
      console.log(`[Voice] Anonymous caller — playing voicemail prompt`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Laura-Neural">
    We konden uw nummer niet herkennen. Spreek na de piep uw naam en telefoonnummer in, dan bellen wij u zo snel mogelijk terug.
  </Say>
  <Record maxLength="60" transcribe="false" />
</Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ─── Spam/robocall filtering ───
    const spamPrefixes = ["+31900", "+31800", "+310900", "+310800"];
    const isSpam = spamPrefixes.some(p => from.startsWith(p));
    if (isSpam) {
      console.log(`[Voice] Spam number filtered: ***${from.slice(-4)}`);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ─── Cleanup: archive stale/expired leads from this caller ───
    const now = new Date().toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Archive active leads with no response in 24h
    await supabase
      .from("leads")
      .update({ status: "lost" })
      .eq("business_id", business.id)
      .eq("customer_phone", from)
      .eq("status", "active")
      .lt("created_at", twentyFourHoursAgo);

    // Convert past appointments to "converted"
    await supabase
      .from("leads")
      .update({ status: "converted", conversation_mode: "manual" })
      .eq("business_id", business.id)
      .eq("customer_phone", from)
      .eq("status", "appointment_set")
      .lt("appointment_end", now);

    // ─── Check for existing active lead from this caller ───
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, status, conversation_mode, customer_name, appointment_start, source")
      .eq("business_id", business.id)
      .eq("customer_phone", from)
      .in("status", ["active", "qualified", "appointment_set"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLead && existingLead.source !== "manual") {
      console.log(`[Voice] Returning caller ***${from.slice(-4)} — existing lead ${existingLead.id} (${existingLead.status})`);

      if (existingLead.status === "appointment_set") {
        // Has a future appointment — send choice menu via WhatsApp
        const name = existingLead.customer_name || "";
        const greeting = name ? `Hoi ${name}!` : "Hoi!";
        const apptDate = existingLead.appointment_start
          ? new Date(existingLead.appointment_start).toLocaleDateString("nl-NL", {
              weekday: "long", day: "numeric", month: "long",
            })
          : "";
        const apptInfo = apptDate ? ` (${apptDate})` : "";

        const menuMsg = `${greeting} Je belde net en je hebt al een afspraak staan${apptInfo}. Waar kan ik je mee helpen?\n\nAfspraak annuleren — stuur "annuleren"\nAfspraak verzetten — stuur "verzetten"\nNieuwe afspraak — stuur "nieuw"`;

        await supabase.from("leads").update({ conversation_mode: "choice_pending" }).eq("id", existingLead.id);

        if (TEMPLATES.CUSTOMER_CHOICE_MENU) {
          sendNamedTemplate(from, TEMPLATES.CUSTOMER_CHOICE_MENU, {
            "1": name || "klant",
            "2": apptDate || "binnenkort",
          }).catch((err) => {
            console.error("[Voice] Failed to send choice menu:", err);
          });
        } else {
          sendWhatsApp(from, menuMsg).catch((err) => {
            console.error("[Voice] Failed to send choice menu:", err);
          });
        }
        await supabase.from("messages").insert({
          lead_id: existingLead.id,
          business_id: business.id,
          sender: "ai",
          body: menuMsg,
        });
      } else {
        // Active/qualified lead — conversation still ongoing, just notify owner
        if (business.phone) {
          sendWhatsApp(business.phone, `📞 Herhaalde oproep van ${from} — er loopt al een gesprek via Clŷniq.`).catch(() => {});
        }
      }

      return new Response(
        missedCallTwiml(business.name),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ─── Rapid-fire call deduplication (10-min window for archived/lost leads) ───
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentLead } = await supabase
      .from("leads")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_phone", from)
      .gte("created_at", tenMinAgo)
      .limit(1)
      .maybeSingle();

    if (recentLead) {
      console.log(`[Voice] Duplicate call from ***${from.slice(-4)} within 10 min — skipping`);
      return new Response(
        missedCallTwiml(business.name),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Create lead record
    const { data: lead } = await supabase
      .from("leads")
      .insert({
        business_id: business.id,
        customer_phone: from,
        source: "missed_call",
        inbound_call_sid: callSid,
        status: "active",
        conversation_mode: "ai",
      })
      .select("id")
      .maybeSingle();

    // Send WhatsApp greeting + notify owner (async — don't block the call)
    const isSalesMode = (business as Record<string, unknown>).prompt_mode === "sales";
    if (lead) {
      const greeting = isSalesMode
        ? "Hoi, ik had je net gebeld. Ik verkoop een tool die je gemiste bellers automatisch opvangt en inplant. Wil je dat ik het in 5 min laat zien?"
        : `Hey met ${business.name}, ik zag dat je had gebeld. Waarmee kan ik je helpen?`;

      (async () => {
          const SALES_TEMPLATE = process.env.TEMPLATE_SALES_GREETING;
          const businessWhatsApp = business.twilio_number || undefined;
          try {
            if (isSalesMode && SALES_TEMPLATE) {
              await sendNamedTemplate(from, SALES_TEMPLATE, {}, businessWhatsApp);
            } else if (!isSalesMode && TEMPLATES.MISSED_CALL_GREETING) {
              await sendNamedTemplate(from, TEMPLATES.MISSED_CALL_GREETING, { "1": business.name }, businessWhatsApp);
            } else {
              await sendWhatsApp(from, greeting, businessWhatsApp);
            }
          } catch (err) {
            console.error("[Voice] Failed to send WhatsApp greeting:", err);
            return;
          }

          try {
            await supabase.from("messages").insert({
              lead_id: lead.id,
              business_id: business.id,
              sender: "ai",
              body: greeting,
            });
          } catch (err) {
            console.error("[Voice] Failed to save greeting message:", err);
          }

          try {
            await supabase.from("ai_contexts").insert({
              lead_id: lead.id,
              business_id: business.id,
              system_prompt: "",
              messages_json: [{ role: "assistant", content: greeting }],
              gathered_info: {},
              conversation_state: "greeting",
            });
          } catch (err) {
            console.error("[Voice] Failed to create AI context:", err);
          }

          try {
            await supabase
              .from("leads")
              .update({ first_response_at: new Date().toISOString() })
              .eq("id", lead.id)
              .is("first_response_at", null);
          } catch (err) {
            console.error("[Voice] Failed to update first_response_at:", err);
          }
      })().catch((err) => {
        console.error("[Voice] Greeting flow failed:", err);
      });

      // Notify business owner about the new lead (skip in sales mode — you're the owner)
      if (business.phone && !isSalesMode) {
        const ownerMsg = [
          `📞 Gemiste oproep opgevangen`,
          ``,
          `Klant: ${from}`,
          `Clŷniq stuurt nu een WhatsApp naar deze klant.`,
          ``,
          `Bekijk het gesprek in je dashboard.`,
        ].join("\n");
        if (TEMPLATES.OWNER_MISSED_CALL) {
          sendNamedTemplate(business.phone, TEMPLATES.OWNER_MISSED_CALL, { "1": from }).catch((err) => {
            console.error("[Voice] Owner notification failed:", err);
          });
        } else {
          sendWhatsApp(business.phone, ownerMsg).catch((err) => {
            console.error("[Voice] Owner notification failed:", err);
          });
        }
      }
    }

    // Return TwiML — play message and hang up
    return new Response(
      missedCallTwiml(isSalesMode ? "Doran" : business.name),
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("[Voice] Incoming call error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
