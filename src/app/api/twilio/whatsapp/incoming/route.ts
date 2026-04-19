import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsApp, sendNamedTemplate, TEMPLATES } from "@/lib/twilio/whatsapp";
import { generateResponse, type ConversationState } from "@/lib/ai/conversation";
import { verifyTwilioWebhook, formDataToParams } from "@/lib/twilio/verify-webhook";
import { getAvailableSlots } from "@/lib/calendar/availability";
import { parseTimePreference, checkExactTime, buildCheckContext } from "@/lib/calendar/slot-matcher";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, refreshAccessToken } from "@/lib/calendar/google";
import type { ChatMessage } from "@/lib/ai/client";
import { isRateLimited } from "@/lib/rate-limit";
import { notifyOwnerManualMessage } from "@/lib/notifications/owner";
import { searchTreatmentInfo } from "@/lib/ai/search";

/** Detect if a message mentions a specific day. Returns a Date or null. */
function detectRequestedDay(message: string): Date | null {
  const lower = message.toLowerCase().trim();
  const today = new Date();

  const dayKeywords: Record<string, number> = {
    "maandag": 1, "dinsdag": 2, "woensdag": 3, "donderdag": 4,
    "vrijdag": 5, "zaterdag": 6, "zondag": 0,
  };

  if (lower.includes("morgen")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (lower.includes("overmorgen")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }

  for (const [name, dow] of Object.entries(dayKeywords)) {
    if (lower.includes(name)) {
      const d = new Date(today);
      const diff = (dow - today.getDay() + 7) % 7 || 7; // next occurrence
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  return null;
}

/** Add minutes to a local ISO datetime string. TZ=Europe/Amsterdam is set on Railway. */
function addMinutes(localISO: string, minutes: number): string {
  const date = new Date(localISO);
  if (isNaN(date.getTime())) return localISO;
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function twimlOk() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

/**
 * Twilio WhatsApp webhook — fires when a customer sends a WhatsApp message.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Verify request is from Twilio
    const params = formDataToParams(formData);
    if (!verifyTwilioWebhook(request, params, "/api/twilio/whatsapp/incoming")) {
      console.warn("[WhatsApp] Webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    }

    const from = formData.get("From") as string; // whatsapp:+31...
    const rawBody = formData.get("Body") as string;
    let body = rawBody?.slice(0, 1000) ?? "";
    // Sanitize: strip ###INFO### markers to prevent AI response injection
    body = body.replace(/###INFO###/gi, "").trim();
    const customerPhone = from.replace("whatsapp:", "");

    // ─── Media detection (voice notes, images, videos) ───
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");
    if (numMedia > 0 && !body.trim()) {
      // Media-only message with no text — we can't process it
      console.log(`[WhatsApp] Media-only message from ***${customerPhone.slice(-4)} (${numMedia} media)`);
      // We'll handle this after finding the lead — for now just flag it
    }

    // ─── Emoji-only handling ───
    const trimmed = body.trim();
    const isEmojiOnly = trimmed.length <= 8 && /^[^\w\d\s]*$/.test(trimmed.replace(/\s/g, "")) && !/[a-zA-Z0-9]/.test(trimmed);
    if (body && isEmojiOnly) {
      if (body.includes("👍") || body.includes("✅") || body.includes("🙏")) {
        body = "ja";
      }
      // Other single emojis: let AI handle naturally
    }

    // ─── Auto-reply detection ───
    const autoReplyPatterns = [
      /bedankt.{0,20}(contact|bericht)/i,
      /momenteel niet beschikbaar/i,
      /buiten kantooruren/i,
      /we (zijn|reageren).*zo snel mogelijk/i,
      /laat ons weten hoe we.*kunnen helpen/i,
      /vanwege de drukte/i,
    ];
    const isAutoReply = autoReplyPatterns.some(p => p.test(body));

    console.log(`[WhatsApp] Incoming from ***${customerPhone.slice(-4)}: "${body.slice(0, 50)}"${isAutoReply ? " (auto-reply)" : ""}${numMedia > 0 ? ` (${numMedia} media)` : ""}`);

    // Rate limit: 20 messages per phone number per minute
    if (isRateLimited(`wa:${customerPhone}`, 20)) {
      return twimlOk();
    }

    const supabase = createServiceRoleClient();

    // ─── STOP/opt-out handling (GDPR compliance) ───
    const normalizedBody = body.trim().toLowerCase();
    if (normalizedBody === "stop" || normalizedBody === "uitschrijven" || normalizedBody === "verwijder mijn gegevens") {
      // Get all lead IDs for this phone number
      const { data: leadsToDelete } = await supabase
        .from("leads")
        .select("id")
        .eq("customer_phone", customerPhone);

      const leadIds = leadsToDelete?.map((l) => l.id) || [];

      if (leadIds.length > 0) {
        // Delete messages, AI contexts, then leads
        await supabase.from("messages").delete().in("lead_id", leadIds);
        await supabase.from("ai_contexts").delete().in("lead_id", leadIds);
        await supabase.from("leads").delete().in("id", leadIds);
      }

      const toNumber = (formData.get("To") as string || "").replace("whatsapp:", "");
      const { data: optOutBiz } = await supabase
        .from("businesses")
        .select("twilio_number, whatsapp_personal")
        .eq("twilio_number", toNumber)
        .maybeSingle();

      await sendWhatsApp(
        customerPhone,
        "Je bent uitgeschreven en je gegevens zijn verwijderd. Je ontvangt geen berichten meer van dit nummer. Mocht je in de toekomst toch hulp nodig hebben, stuur dan gerust een berichtje.",
        optOutBiz?.whatsapp_personal ? optOutBiz.twilio_number : undefined
      );
      console.log(`[WhatsApp] Opt-out + data deletion processed for ***${customerPhone.slice(-4)} (${leadIds.length} leads deleted)`);
      return twimlOk();
    }

    // Deduplication: skip if we already processed this Twilio message
    const messageSid = formData.get("MessageSid") as string;
    if (messageSid) {
      const { data: existingMsg } = await supabase
        .from("messages")
        .select("id")
        .eq("twilio_sid", messageSid)
        .maybeSingle();
      if (existingMsg) {
        console.log(`[WhatsApp] Duplicate message ${messageSid} — skipping`);
        return twimlOk();
      }
    }

    // ─── Cleanup: archive stale/expired leads from this caller ───
    const now = new Date().toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Archive active leads with no response in 24h
    await supabase
      .from("leads")
      .update({ status: "lost" })
      .eq("customer_phone", customerPhone)
      .eq("status", "active")
      .lt("created_at", twentyFourHoursAgo);

    // Convert past appointments to "converted"
    await supabase
      .from("leads")
      .update({ status: "converted", conversation_mode: "manual" })
      .eq("customer_phone", customerPhone)
      .eq("status", "appointment_set")
      .lt("appointment_end", now);

    // ─── Step 1: Find active/qualified lead (ongoing conversation) ───
    let { data: lead } = await supabase
      .from("leads")
      .select("id, business_id, status, conversation_mode")
      .eq("customer_phone", customerPhone)
      .in("status", ["active", "qualified"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ─── Step 2: Check for choice_pending lead (waiting for menu response) ───
    if (!lead) {
      const { data: pendingLead } = await supabase
        .from("leads")
        .select("id, business_id, status, conversation_mode, customer_name")
        .eq("customer_phone", customerPhone)
        .eq("conversation_mode", "choice_pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pendingLead) {
        // Fetch the business WhatsApp number once, used for all customer-facing replies in this block
        const { data: step2Biz } = await supabase
          .from("businesses")
          .select("twilio_number, whatsapp_personal")
          .eq("id", pendingLead.business_id)
          .single();
        const pendingBusinessWA = step2Biz?.whatsapp_personal ? step2Biz?.twilio_number : undefined;

        const lowerBody = body.toLowerCase().trim();
        const isBestaand = ["bestaand", "bestaande", "huidige", "afspraak", "verzet", "verplaats", "annul", "cancel", "afzeg"].some(k => lowerBody.includes(k));
        const isVerzetten = ["verzet", "verplaats", "wijzig", "ander moment", "andere dag", "andere tijd"].some(k => lowerBody.includes(k));
        const isAnnuleren = ["annul", "cancel", "afzeg", "niet meer", "hoeft niet", "kan niet", "kan niet meer", "gaat niet lukken", "lukt niet", "ziek", "toch niet"].some(k => lowerBody.includes(k));
        const isNieuw = ["nieuw", "ander probleem", "iets anders", "nieuwe klus"].some(k => lowerBody.includes(k));

        // Save the customer's choice message
        await supabase.from("messages").insert({
          lead_id: pendingLead.id,
          business_id: pendingLead.business_id,
          sender: "customer",
          body,
        });

        // Helper: get business info + notify owner
        const handleManualRoute = async (notifText: string, replyText: string) => {
          await supabase.from("leads").update({ conversation_mode: "manual", manual_mode_at: new Date().toISOString() }).eq("id", pendingLead.id);
          const { data: biz } = await supabase
            .from("businesses")
            .select("phone, name, twilio_number, whatsapp_personal")
            .eq("id", pendingLead.business_id)
            .single();
          const replyMsg = replyText.replace("{naam}", biz?.name || "ons");
          await sendWhatsApp(customerPhone, replyMsg, biz?.whatsapp_personal ? biz?.twilio_number : undefined);
          await supabase.from("messages").insert({
            lead_id: pendingLead.id,
            business_id: pendingLead.business_id,
            sender: "ai",
            body: replyMsg,
          });
          if (biz?.phone) {
            notifyOwnerManualMessage(
              biz.phone,
              pendingLead.customer_name || customerPhone,
              notifText,
              pendingLead.id
            );
          }
        };

        if (isVerzetten) {
          // Direct verzetten match
          await handleManualRoute(
            `Wil afspraak verzetten: "${body.slice(0, 100)}"`,
            `Ik stuur je door naar {naam} om je afspraak te verzetten. Je krijgt zo antwoord.`
          );
          // Also send template notification to owner (uses global number — owner-facing)
          const { data: bizForTemplate } = await supabase
            .from("businesses")
            .select("phone")
            .eq("id", pendingLead.business_id)
            .single();
          if (bizForTemplate?.phone && TEMPLATES.OWNER_APPOINTMENT_RESCHEDULED) {
            sendNamedTemplate(bizForTemplate.phone, TEMPLATES.OWNER_APPOINTMENT_RESCHEDULED, {
              "1": pendingLead.customer_name || customerPhone,
              "2": customerPhone,
            }).catch(() => {});
          }
          console.log(`[WhatsApp] Returning customer: reschedule`);
          return twimlOk();
        } else if (isAnnuleren) {
          // Cancel the appointment
          const { data: biz } = await supabase
            .from("businesses")
            .select("phone, name, twilio_number, whatsapp_personal")
            .eq("id", pendingLead.business_id)
            .single();

          // Delete Google Calendar event if one exists
          const { data: cancelLead } = await supabase
            .from("leads")
            .select("google_event_id")
            .eq("id", pendingLead.id)
            .single();

          if (cancelLead?.google_event_id) {
            try {
              const { data: calToken } = await supabase
                .from("google_calendar_tokens")
                .select("access_token, refresh_token, token_expiry, calendar_id")
                .eq("business_id", pendingLead.business_id)
                .single();

              if (calToken) {
                let accessToken = calToken.access_token;
                if (new Date(calToken.token_expiry) <= new Date()) {
                  const refreshed = await refreshAccessToken(calToken.refresh_token);
                  accessToken = refreshed.accessToken;
                }
                await deleteCalendarEvent(accessToken, calToken.calendar_id || "primary", cancelLead.google_event_id);
                console.log(`[WhatsApp] Deleted calendar event ${cancelLead.google_event_id}`);
              }
            } catch (err) {
              console.error("[WhatsApp] Failed to delete calendar event:", err);
            }
          }

          // Update lead status
          await supabase.from("leads").update({
            status: "lost",
            conversation_mode: "manual",
            appointment_start: null,
            appointment_end: null,
            google_event_id: null,
          }).eq("id", pendingLead.id);

          const bizName = biz?.name || "ons";
          const bizPhone = biz?.phone || "";
          const cancelMsg = `Je afspraak is geannuleerd. Wil je een nieuwe afspraak inplannen? Stuur "nieuw". Of neem direct contact op met ${bizName}: ${bizPhone}`;

          await sendWhatsApp(customerPhone, cancelMsg, biz?.whatsapp_personal ? biz?.twilio_number : undefined);
          await supabase.from("messages").insert({
            lead_id: pendingLead.id,
            business_id: pendingLead.business_id,
            sender: "ai",
            body: cancelMsg,
          });

          // Notify owner
          if (biz?.phone) {
            if (TEMPLATES.OWNER_APPOINTMENT_CANCELLED) {
              sendNamedTemplate(biz.phone, TEMPLATES.OWNER_APPOINTMENT_CANCELLED, {
                "1": pendingLead.customer_name || customerPhone,
              }).catch(() => {});
            } else {
              sendWhatsApp(biz.phone, `Afspraak geannuleerd door ${pendingLead.customer_name || customerPhone}. De klant heeft de optie gekregen om opnieuw in te plannen.`).catch(() => {});
            }
          }

          console.log(`[WhatsApp] Returning customer: cancelled appointment`);
          return twimlOk();
        } else if (isBestaand && !isNieuw) {
          // Customer said "bestaand" → ask what they want to do with it
          const subMenuMsg = `Wil je je afspraak annuleren of verzetten?\n\nStuur "annuleren" of "verzetten".`;
          await sendWhatsApp(customerPhone, subMenuMsg, pendingBusinessWA);
          await supabase.from("messages").insert({
            lead_id: pendingLead.id,
            business_id: pendingLead.business_id,
            sender: "ai",
            body: subMenuMsg,
          });
          // Keep choice_pending so the next message routes back here
          console.log(`[WhatsApp] Returning customer: asked about existing → sub-menu`);
          return twimlOk();
        } else if (isNieuw) {
          // New appointment → archive old lead
          await supabase.from("leads").update({
            conversation_mode: "manual",
            status: "archived",
          }).eq("id", pendingLead.id);

          console.log(`[WhatsApp] Returning customer: new appointment`);
          // Fall through to Step 4 to create a new lead
          // Replace body so AI doesn't process "nieuw" as a problem
          body = "[Terugkerende klant wil een nieuwe afspraak maken. Stuur een begroeting en vraag wat het probleem is.]";
        } else {
          // Didn't match — re-send menu
          const menuMsg = `Stuur "bestaand" als het over je huidige afspraak gaat, of "nieuw" als je een nieuwe afspraak wilt maken.`;
          await sendWhatsApp(customerPhone, menuMsg, pendingBusinessWA);
          await supabase.from("messages").insert({
            lead_id: pendingLead.id,
            business_id: pendingLead.business_id,
            sender: "ai",
            body: menuMsg,
          });
          return twimlOk();
        }
      }
    }

    // ─── Step 3: Check for appointment_set lead (returning customer with FUTURE appointment) ───
    if (!lead) {
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, business_id, customer_name, appointment_start")
        .eq("customer_phone", customerPhone)
        .eq("status", "appointment_set")
        .gt("appointment_start", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingLead) {
        // Fetch business WhatsApp number for customer-facing replies
        const { data: step3Biz } = await supabase
          .from("businesses")
          .select("twilio_number, whatsapp_personal")
          .eq("id", existingLead.business_id)
          .single();
        const existingBusinessWA = step3Biz?.whatsapp_personal ? step3Biz?.twilio_number : undefined;

        // Format appointment date for the message
        const apptDate = existingLead.appointment_start
          ? new Date(existingLead.appointment_start).toLocaleDateString("nl-NL", {
              weekday: "long", day: "numeric", month: "long",
            })
          : "";
        const apptTime = existingLead.appointment_start
          ? (new Date(existingLead.appointment_start).getHours() < 12 ? "ochtend" : "middag")
          : "";
        const apptInfo = apptDate ? ` (${apptDate} ${apptTime})` : "";

        // If customer is just acknowledging the reminder, reply briefly and skip the menu
        const isAcknowledgement =
          /^(dank|bedankt|dankje|dankjewel|merci|ok|oke|oké|top|prima|goed|fijn|perfect|super|mooi|tot dan|tot morgen|tot zo|we zijn er|klaar voor|genoteerd|begrepen|we zien|zien we|👍|🙏|✅|👋)/.test(normalizedBody)
          || body.trim().length <= 12;

        if (isAcknowledgement) {
          const apptTimeFormatted = existingLead.appointment_start
            ? new Date(existingLead.appointment_start).toLocaleTimeString("nl-NL", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
              })
            : "";
          const ackReply = apptTimeFormatted ? `Fijn! Tot ${apptTimeFormatted} 👋` : "Fijn! Tot dan 👋";
          await supabase.from("messages").insert({ lead_id: existingLead.id, business_id: existingLead.business_id, sender: "customer", body });
          await sendWhatsApp(customerPhone, ackReply, existingBusinessWA);
          await supabase.from("messages").insert({ lead_id: existingLead.id, business_id: existingLead.business_id, sender: "ai", body: ackReply });
          console.log(`[WhatsApp] Acknowledgement reply to appointment reminder`);
          return twimlOk();
        }

        // Simple two-option menu
        const name = existingLead.customer_name || "";
        const greeting = name ? `Hoi ${name}!` : `Hoi!`;
        const menuMsg = `${greeting} Je hebt een afspraak staan${apptInfo}. Gaat dit over je bestaande afspraak of wil je een nieuwe afspraak maken?\n\nStuur "bestaand" of "nieuw".`;

        await supabase.from("leads").update({ conversation_mode: "choice_pending" }).eq("id", existingLead.id);

        // Save incoming message and menu response
        await supabase.from("messages").insert({
          lead_id: existingLead.id,
          business_id: existingLead.business_id,
          sender: "customer",
          body,
        });

        await sendWhatsApp(customerPhone, menuMsg, existingBusinessWA);
        await supabase.from("messages").insert({
          lead_id: existingLead.id,
          business_id: existingLead.business_id,
          sender: "ai",
          body: menuMsg,
        });

        console.log(`[WhatsApp] Returning customer — sent choice menu`);
        return twimlOk();
      }
    }

    // ─── Step 3b: Recent converted lead (customer replied to review request) ───
    if (!lead) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: convertedLead } = await supabase
        .from("leads")
        .select("id, business_id")
        .eq("customer_phone", customerPhone)
        .eq("status", "converted")
        .gte("updated_at", sevenDaysAgo)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convertedLead) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("phone, twilio_number, whatsapp_personal")
          .eq("id", convertedLead.business_id)
          .single();

        const cannedReply = biz?.phone
          ? `Bedankt voor je bericht! Heb je een nieuwe klus of vraag? Bel ons gerust op ${biz.phone}.`
          : "Bedankt voor je bericht! Heb je een nieuwe klus of vraag? Neem dan gerust contact met ons op.";

        await supabase.from("messages").insert({ lead_id: convertedLead.id, business_id: convertedLead.business_id, sender: "customer", body });
        await sendWhatsApp(customerPhone, cannedReply, biz?.whatsapp_personal ? biz?.twilio_number : undefined);
        await supabase.from("messages").insert({ lead_id: convertedLead.id, business_id: convertedLead.business_id, sender: "ai", body: cannedReply });
        console.log(`[WhatsApp] Canned reply to converted lead (review request response)`);
        return twimlOk();
      }
    }

    // ─── Step 4: No existing lead — create a new one ───
    if (!lead) {
      const to = formData.get("To") as string; // whatsapp:+31...
      const toPhone = to.replace("whatsapp:", "");

      // Find business by twilio_number (personal number after trial)
      let businessId: string | null = null;

      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("twilio_number", toPhone)
        .eq("speed_leads_active", true)
        .limit(1)
        .maybeSingle();

      if (business) {
        businessId = business.id;
      }

      // Fallback: if message came to the shared WhatsApp number (trial users),
      // find the business from the caller's most recent lead
      if (!businessId && toPhone === process.env.TWILIO_WHATSAPP_NUMBER) {
        const { data: prevLead } = await supabase
          .from("leads")
          .select("business_id")
          .eq("customer_phone", customerPhone)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (prevLead) {
          businessId = prevLead.business_id;
        }

        // Last resort: if no previous lead, find a sales-mode business (for ad-driven traffic)
        if (!businessId) {
          const { data: salesBiz } = await supabase
            .from("businesses")
            .select("id")
            .eq("prompt_mode", "sales")
            .eq("speed_leads_active", true)
            .limit(1)
            .maybeSingle();
          if (salesBiz) {
            businessId = salesBiz.id;
          }
        }
      }

      if (!businessId) {
        console.log(`[WhatsApp] No business found for number ${toPhone}, dropping message`);
        return twimlOk();
      }

      // Check for previous leads from this phone number to pre-fill known info
      const { data: previousLead } = await supabase
        .from("leads")
        .select("customer_name, address")
        .eq("customer_phone", customerPhone)
        .not("customer_name", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const prefillName = previousLead?.customer_name || null;
      const prefillAddress = previousLead?.address || null;

      const { data: newLead } = await supabase
        .from("leads")
        .insert({
          business_id: businessId,
          customer_phone: customerPhone,
          customer_name: prefillName,
          address: prefillAddress,
          source: "whatsapp",
          status: "active",
          conversation_mode: "ai",
        })
        .select("id, business_id, status, conversation_mode")
        .single();

      lead = newLead;

      if (!lead) {
        console.log(`[WhatsApp] Failed to create lead for ***${customerPhone.slice(-4)}`);
        return twimlOk();
      }

      // Pre-fill gathered info so AI skips asking name (and confirms address instead of asking)
      const gatheredInfo: Record<string, string> = {};
      if (prefillName) gatheredInfo.customerName = prefillName;
      if (prefillAddress) gatheredInfo.address = prefillAddress;

      // Check if this is a sales-mode business (for direct WhatsApp from ads)
      const { data: newLeadBiz } = await supabase
        .from("businesses")
        .select("prompt_mode")
        .eq("id", lead.business_id)
        .single();
      const isSalesDirect = newLeadBiz?.prompt_mode === "sales";

      // Create initial AI context
      // Sales mode direct messages: start at "qualifying" (greeting was never sent)
      await supabase.from("ai_contexts").insert({
        lead_id: lead.id,
        business_id: lead.business_id,
        system_prompt: "",
        messages_json: [],
        gathered_info: gatheredInfo,
        conversation_state: isSalesDirect ? "qualifying" : "greeting",
      });

      console.log(`[WhatsApp] New direct lead created for ***${customerPhone.slice(-4)}`);
    }

    // Save incoming message
    await supabase.from("messages").insert({
      lead_id: lead.id,
      business_id: lead.business_id,
      sender: "customer",
      body,
    });

    // ─── Media-only message: respond with text request ───
    if (numMedia > 0 && !body.trim()) {
      const mediaReply = "Ik kan alleen tekstberichten lezen. Stuur een berichtje, dan help ik je verder.";
      await sendWhatsApp(customerPhone, mediaReply);
      await supabase.from("messages").insert({
        lead_id: lead.id,
        business_id: lead.business_id,
        sender: "ai",
        body: mediaReply,
      });
      return twimlOk();
    }

    // ─── Auto-reply: save but don't trigger AI ───
    if (isAutoReply) {
      console.log(`[WhatsApp] Auto-reply detected from ***${customerPhone.slice(-4)}, skipping AI`);
      return twimlOk();
    }

    // If conversation is in manual mode, notify owner and don't auto-respond
    if (lead.conversation_mode === "manual") {
      const { data: biz } = await supabase
        .from("businesses")
        .select("phone, name")
        .eq("id", lead.business_id)
        .single();

      if (biz?.phone) {
        const { data: leadData } = await supabase
          .from("leads")
          .select("customer_name")
          .eq("id", lead.id)
          .single();

        notifyOwnerManualMessage(
          biz.phone,
          leadData?.customer_name || customerPhone,
          body,
          lead.id
        );
      }
      return twimlOk();
    }

    // Get business info
    const { data: business } = await supabase
      .from("businesses")
      .select("name, trade, service_area, phone, email, available_hours, slot_duration_minutes, max_appointments_per_day, status, subscription_ends_at, speed_leads_active, twilio_number, whatsapp_personal, prompt_mode, demo_followup_message, treatment_info")
      .eq("id", lead.business_id)
      .single();

    if (!business) {
      return twimlOk();
    }

    // Check if service period has expired
    // Only check expiry for trialing or cancelled — active paid subscriptions don't expire
    if (
      (business.status === "trialing" || business.status === "cancelled") &&
      business.subscription_ends_at &&
      new Date(business.subscription_ends_at) < new Date()
    ) {
      await supabase
        .from("businesses")
        .update({ speed_leads_active: false })
        .eq("id", lead.business_id);
      console.log(`[WhatsApp] Service period expired for business ${lead.business_id} (status: ${business.status})`);
      return twimlOk();
    }

    // Don't respond if service is not active
    if (!business.speed_leads_active) {
      return twimlOk();
    }

    // Get AI context
    const { data: ctx } = await supabase
      .from("ai_contexts")
      .select("lead_id, messages_json, gathered_info, conversation_state")
      .eq("lead_id", lead.id)
      .single();

    let messages: ChatMessage[] = ctx?.messages_json ?? [];
    // Window conversation history to prevent context overflow (keep last 15 messages)
    if (messages.length > 15) {
      messages = messages.slice(-15);
    }
    let state: ConversationState = (ctx?.conversation_state as ConversationState) ?? "greeting";

    // If conversation ended (e.g. wrong trade), reset and start fresh
    if (state === "ended") {
      await supabase.from("ai_contexts").update({
        messages_json: [],
        // Keep gathered_info — customer may restart with same name/address
        conversation_state: "greeting",
      }).eq("lead_id", lead.id);

      await supabase.from("leads").update({
        status: "active",
        conversation_mode: "ai",
        problem_summary: null,
        address: null,
        urgency: null,
      }).eq("id", lead.id);

      // Reset local state so the rest of the handler uses fresh context
      messages = [];
      state = "greeting";
    }

    // ─── Fetch available calendar slots ─────────────────────
    let availableSlots: string[] | undefined;
    try {
      const { data: calToken } = await supabase
        .from("google_calendar_tokens")
        .select("access_token, refresh_token, token_expiry, calendar_id")
        .eq("business_id", lead.business_id)
        .single();

      if (calToken) {
        let accessToken = calToken.access_token;

        // Refresh token if expired
        if (new Date(calToken.token_expiry) < new Date()) {
          try {
            const refreshed = await refreshAccessToken(calToken.refresh_token);
            accessToken = refreshed.accessToken;

            // Save new access token
            await supabase
              .from("google_calendar_tokens")
              .update({
                access_token: accessToken,
                token_expiry: new Date(
                  Date.now() + refreshed.expiresIn * 1000
                ).toISOString(),
              })
              .eq("business_id", lead.business_id);
          } catch (refreshErr) {
            console.error("[WhatsApp] Token refresh failed:", refreshErr);
            // Continue without calendar - AI will handle gracefully
          }
        }

        const isSalesMode = (business as Record<string, unknown>).prompt_mode === "sales";
        const slots = await getAvailableSlots(
          accessToken,
          calToken.calendar_id || "primary",
          {
            businessHours: business.available_hours,
            slotDuration: business.slot_duration_minutes || (isSalesMode ? 10 : 120),
            maxPerDay: business.max_appointments_per_day || 6,
            bufferMinutes: isSalesMode ? 5 : 30,
            limit: 4,
          }
        );
        if (slots.length === 0) {
          availableSlots = ["GEEN BESCHIKBAARHEID de komende 2 weken. Zeg: 'Helaas zit mijn agenda de komende twee weken vol. Kan ik je terugbellen als er plek vrijkomt?'"];
        } else {
          availableSlots = slots.map((s) => s.label);
        }
      }
    } catch (err) {
      console.error("[WhatsApp] Failed to fetch calendar slots:", err);
      // Continue without slots — AI will handle it gracefully
    }

    // Read all customer messages since the last AI response
    const { data: lastAiMsg } = await supabase
      .from("messages")
      .select("created_at")
      .eq("lead_id", lead.id)
      .in("sender", ["ai", "owner"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: pendingMsgs } = await supabase
      .from("messages")
      .select("body")
      .eq("lead_id", lead.id)
      .eq("sender", "customer")
      .gt("created_at", lastAiMsg?.created_at || "1970-01-01")
      .order("created_at", { ascending: true });

    // If this isn't the latest pending message, skip (another call will handle it)
    if (pendingMsgs && pendingMsgs.length > 0 && pendingMsgs[pendingMsgs.length - 1].body !== body) {
      return twimlOk();
    }

    // Combine all pending messages into one
    const combinedBody = pendingMsgs && pendingMsgs.length > 1
      ? pendingMsgs.map((m) => m.body).join("\n")
      : body;

    // Fetch treatment context from vector search (if available)
    let treatmentContext = "";
    const promptMode = (business as Record<string, unknown>).prompt_mode as "service" | "sales" | undefined;
    if (promptMode !== "sales") {
      try {
        treatmentContext = await searchTreatmentInfo(lead.business_id, combinedBody);
      } catch (err) {
        console.warn("[WhatsApp] Vector search failed, using treatment_info fallback:", err);
      }
      // Fallback to treatment_info text field if no vector results
      if (!treatmentContext && (business as Record<string, unknown>).treatment_info) {
        treatmentContext = String((business as Record<string, unknown>).treatment_info);
      }
    }

    // Generate AI response
    let { reply, newState, info } = await generateResponse(
      {
        business: {
          businessName: business.name,
          trade: business.trade,
          serviceArea: business.service_area ?? undefined,
        },
        state,
        messages,
        gatheredInfo: ctx?.gathered_info ?? {},
        availableSlots,
        promptMode,
        treatmentContext,
      },
      combinedBody
    );

    // ─── Two-pass scheduling: if customer requested a specific day, re-fetch slots ───
    const isScheduling = newState === "scheduling" || state === "scheduling";
    const noBooking = !info.appointmentStart;
    const requestedDay = detectRequestedDay(combinedBody);

    console.log(`[WhatsApp] Two-pass check: isScheduling=${isScheduling}, noBooking=${noBooking}, requestedDay=${requestedDay?.toISOString()}, msg="${combinedBody}"`);

    if (isScheduling && noBooking && requestedDay) {
      try {
        const { data: calToken } = await supabase
          .from("google_calendar_tokens")
          .select("access_token, refresh_token, token_expiry, calendar_id")
          .eq("business_id", lead.business_id)
          .single();

        if (calToken) {
          let accessToken = calToken.access_token;
          if (new Date(calToken.token_expiry) < new Date()) {
            const refreshed = await refreshAccessToken(calToken.refresh_token);
            accessToken = refreshed.accessToken;
            await supabase
              .from("google_calendar_tokens")
              .update({
                access_token: accessToken,
                token_expiry: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
              })
              .eq("business_id", lead.business_id);
          }

          // Direct calendar check: ask Google "is this exact time free?"
          const timePref = parseTimePreference(combinedBody);
          const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][requestedDay.getDay()];
          const bh = business.available_hours?.[dayKey as keyof typeof business.available_hours] as { start: string; end: string } | null | undefined;
          const isSalesCheck = (business as Record<string, unknown>).prompt_mode === "sales";
          const slotDur = business.slot_duration_minutes || (isSalesCheck ? 10 : 120);

          console.log(`[WhatsApp] Direct check: timePref=${JSON.stringify(timePref)}, slotDur=${slotDur}, bh=${JSON.stringify(bh)}`);

          if (timePref) {
            const checkResult = await checkExactTime(
              accessToken,
              calToken.calendar_id || "primary",
              requestedDay,
              timePref,
              slotDur,
              bh,
            );
            console.log(`[WhatsApp] Check result: available=${checkResult.available}, label=${checkResult.requestedLabel}, alts=${checkResult.alternatives.length}`);
            const slotContext = buildCheckContext(checkResult);
            console.log(`[WhatsApp] Slot context: ${slotContext}`);

            // Re-run AI with the direct check result
            const retry = await generateResponse(
              {
                business: {
                  businessName: business.name,
                  trade: business.trade,
                  serviceArea: business.service_area ?? undefined,
                },
                state,
                messages,
                gatheredInfo: ctx?.gathered_info ?? {},
                availableSlots: [slotContext],
                promptMode: (business as Record<string, unknown>).prompt_mode as "service" | "sales" | undefined,
              },
              combinedBody
            );
            reply = retry.reply;
            newState = retry.newState;
            info = retry.info;
          }
        }
      } catch (err) {
        console.error("[WhatsApp] Day-specific slot fetch failed:", err);
        // Continue with original reply
      }
    }

    // ─── Typing delay: simulate human response time ───
    const typingDelay = Math.max(1500, Math.min(4000, reply.length * 20));
    await new Promise((r) => setTimeout(r, typingDelay));

    // Send AI reply via WhatsApp (from the business's dedicated pool number)
    const sentMsg = await sendWhatsApp(customerPhone, reply, business.whatsapp_personal ? business.twilio_number : undefined);

    // Save AI message with Twilio SID for delivery tracking
    await supabase.from("messages").insert({
      lead_id: lead.id,
      business_id: lead.business_id,
      sender: "ai",
      body: reply,
      twilio_sid: sentMsg?.sid || null,
    });

    // Track first response time (for avg response time stats)
    if (messages.length === 0) {
      await supabase
        .from("leads")
        .update({ first_response_at: new Date().toISOString() })
        .eq("id", lead.id)
        .is("first_response_at", null);
    }

    // Re-read current context to merge with any concurrent updates
    const { data: latestCtx } = await supabase
      .from("ai_contexts")
      .select("messages_json, gathered_info")
      .eq("lead_id", lead.id)
      .single();

    const mergedMessages = latestCtx?.messages_json ?? [];
    // Only add our new messages if they're not already there
    const lastStoredContent = mergedMessages.length > 0
      ? mergedMessages[mergedMessages.length - 1]?.content
      : null;
    if (lastStoredContent !== reply) {
      mergedMessages.push(
        { role: "user" as const, content: body },
        { role: "assistant" as const, content: reply }
      );
    }

    // Merge gathered info (keep newest values)
    const mergedInfo = { ...(latestCtx?.gathered_info ?? {}), ...info };

    // Window on write: keep only last 15 messages
    if (mergedMessages.length > 15) {
      mergedMessages.splice(0, mergedMessages.length - 15);
    }

    await supabase
      .from("ai_contexts")
      .upsert(
        {
          lead_id: lead.id,
          business_id: lead.business_id,
          system_prompt: "",
          messages_json: mergedMessages,
          gathered_info: mergedInfo,
          conversation_state: newState,
        },
        { onConflict: "lead_id" }
      );

    // Update lead with gathered info
    const leadUpdate: Record<string, string | null> = {};
    if (info.customerName) leadUpdate.customer_name = info.customerName;
    if (info.problem) leadUpdate.problem_summary = info.problem;
    if (info.problemDetails) leadUpdate.problem_details = info.problemDetails;
    if (info.address) leadUpdate.address = info.address;
    if (info.urgency) leadUpdate.urgency = info.urgency;

    if (Object.keys(leadUpdate).length > 0) {
      await supabase.from("leads").update(leadUpdate).eq("id", lead.id);
    }

    // ─── Handle appointment confirmation ────────────────────
    if (newState === "confirmed" && state !== "confirmed") {
      // Always calculate end time from business slot_duration_minutes — ignore AI's appointmentEnd
      const slotMinutes = business.slot_duration_minutes || 120;
      const appointmentEnd = info.appointmentStart
        ? addMinutes(info.appointmentStart, slotMinutes)
        : null;

      // Try to create a Google Calendar event first, then update lead with all data at once
      let calendarEventId: string | null = null;
      try {
        const { data: calToken } = await supabase
          .from("google_calendar_tokens")
          .select("access_token, refresh_token, token_expiry, calendar_id")
          .eq("business_id", lead.business_id)
          .single();

        if (calToken && info.appointmentStart) {
          // Validate the date before creating calendar event
          const startDate = new Date(info.appointmentStart);
          if (isNaN(startDate.getTime())) {
            console.error("[WhatsApp] Invalid appointmentStart:", info.appointmentStart);
          } else {
            // Double-booking check: verify slot is still free
            const { data: overlappingLead } = await supabase
              .from("leads")
              .select("id")
              .eq("business_id", lead.business_id)
              .eq("status", "appointment_set")
              .neq("id", lead.id)
              .lt("appointment_start", appointmentEnd || addMinutes(info.appointmentStart, slotMinutes))
              .gt("appointment_end", info.appointmentStart)
              .limit(1)
              .maybeSingle();

            if (overlappingLead) {
              console.warn("[WhatsApp] Double booking prevented — slot taken");
              const sorryMsg = "Helaas is dit tijdslot net geboekt door iemand anders. Ik zoek een nieuw moment voor je.";
              await sendWhatsApp(customerPhone, sorryMsg);
              await supabase.from("messages").insert({
                lead_id: lead.id,
                business_id: lead.business_id,
                sender: "ai",
                body: sorryMsg,
              });
              // Reset state to scheduling so AI offers new slots
              await supabase.from("ai_contexts").update({ conversation_state: "scheduling" }).eq("lead_id", lead.id);
              return twimlOk();
            }
            let accessToken = calToken.access_token;
            if (new Date(calToken.token_expiry) < new Date()) {
              try {
                const refreshed = await refreshAccessToken(calToken.refresh_token);
                accessToken = refreshed.accessToken;
              } catch (refreshErr) {
                console.error("[WhatsApp] Token refresh failed:", refreshErr);
                // Continue without calendar - AI will handle gracefully
              }
            }

            const calEvent = await createCalendarEvent(
              accessToken,
              calToken.calendar_id || "primary",
              {
                summary: (business as Record<string, unknown>).prompt_mode === "sales"
                  ? `Clŷniq Demo — ${info.customerName || "Klant"}`
                  : `${info.customerName || "Klant"} — ${info.problem || "Afspraak"}`,
                description: ((business as Record<string, unknown>).prompt_mode === "sales"
                  ? [
                      `Prospect: ${info.customerName || "Onbekend"}`,
                      `Telefoon: ${customerPhone}`,
                      `Vakgebied: ${info.problem || ""}`,
                      `Gemiste oproepen: ${info.address || ""}`,
                      "",
                      "Clŷniq sales demo",
                    ]
                  : [
                      `Klant: ${info.customerName || "Onbekend"}`,
                      `Telefoon: ${customerPhone}`,
                      `Probleem: ${info.problem || ""}`,
                      info.problemDetails ? `Details: ${info.problemDetails}` : "",
                      info.address ? `Adres: ${info.address}` : "",
                      `Urgentie: ${info.urgency || "onbekend"}`,
                      "",
                      "Aangemaakt door Clŷniq",
                    ])
                  .filter(Boolean)
                  .join("\n"),
                location: info.address,
                start: info.appointmentStart,
                end: appointmentEnd || addMinutes(info.appointmentStart, slotMinutes),
              }
            );

            if (calEvent?.eventId) {
              calendarEventId = calEvent.eventId;
            }
          } // end date validation else
        }
      } catch (err) {
        console.error("[WhatsApp] Failed to create calendar event:", err);
        // Continue — lead will still be updated with appointment_set but without event ID
      }

      if (!calendarEventId) {
        console.warn("[WhatsApp] Calendar event not created — lead will be set without google_event_id");
      }

      // Update lead status with appointment data and calendar event ID (if available)
      await supabase
        .from("leads")
        .update({
          status: "appointment_set",
          conversation_mode: "manual",
          appointment_start: info.appointmentStart || null,
          appointment_end: appointmentEnd || null,
          google_event_id: calendarEventId,
        })
        .eq("id", lead.id);

      // Notify owner about the booked appointment
      if (business.phone) {
        const ownerMsg = [
          `✅ Afspraak geboekt via Clŷniq!`,
          ``,
          `Klant: ${info.customerName || "Onbekend"}`,
          `Telefoon: ${customerPhone}`,
          info.problem ? `Probleem: ${info.problem}` : null,
          info.address ? `Adres: ${info.address}` : null,
          info.urgency ? `Urgentie: ${info.urgency}` : null,
          ``,
          `Bekijk het volledige gesprek in je dashboard.`,
        ]
          .filter(Boolean)
          .join("\n");
        if (TEMPLATES.OWNER_APPOINTMENT_BOOKED) {
          const apptDateStr = info.appointmentStart
            ? new Date(info.appointmentStart).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
            : "onbekend";
          sendNamedTemplate(business.phone, TEMPLATES.OWNER_APPOINTMENT_BOOKED, {
            "1": info.customerName || "Onbekend",
            "2": customerPhone,
            "3": info.problem || "Niet opgegeven",
            "4": apptDateStr,
          }).catch((err) => {
            console.error("[WhatsApp] Owner appointment notification failed:", err);
          });
        } else {
          sendWhatsApp(business.phone, ownerMsg).catch((err) => {
            console.error("[WhatsApp] Owner appointment notification failed:", err);
          });
        }
      }

      // Send demo follow-up message after 2 minutes (if configured on this business)
      const followupMsg = (business as Record<string, unknown>).demo_followup_message as string | null;
      if (followupMsg) {
        const fromWA = business.whatsapp_personal ? business.twilio_number : undefined;
        setTimeout(() => {
          sendWhatsApp(customerPhone, followupMsg, fromWA ?? undefined).catch((err) => {
            console.error("[WhatsApp] Demo follow-up failed:", err);
          });
        }, 120_000); // 2 minutes
      }
    }

    // ─── Name received after appointment was already booked ────
    // In sales mode, name is asked AFTER time confirmation. Update lead + calendar.
    if (state === "confirmed" && info.customerName) {
      // Fetch current lead to check if name changed and get google_event_id
      const { data: currentLead } = await supabase
        .from("leads")
        .select("customer_name, google_event_id")
        .eq("id", lead.id)
        .single();

      if (currentLead && currentLead.customer_name !== info.customerName) {
        await supabase.from("leads").update({ customer_name: info.customerName }).eq("id", lead.id);

        // Update calendar event with the name
        if (currentLead.google_event_id) {
          try {
            const { data: calToken } = await supabase
              .from("google_calendar_tokens")
              .select("access_token, refresh_token, token_expiry, calendar_id")
              .eq("business_id", lead.business_id)
              .single();

            if (calToken) {
              let accessToken = calToken.access_token;
              if (new Date(calToken.token_expiry) < new Date()) {
                const refreshed = await refreshAccessToken(calToken.refresh_token);
                accessToken = refreshed.accessToken;
                await supabase
                  .from("google_calendar_tokens")
                  .update({
                    access_token: accessToken,
                    token_expiry: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
                  })
                  .eq("business_id", lead.business_id);
              }

              const isSales = (business as Record<string, unknown>).prompt_mode === "sales";
              await updateCalendarEvent(
                accessToken,
                calToken.calendar_id || "primary",
                currentLead.google_event_id,
                {
                  summary: isSales
                    ? `Clŷniq Demo — ${info.customerName}`
                    : `${info.customerName} — ${info.problem || "Afspraak"}`,
                }
              );
            }
          } catch (err) {
            console.error("[WhatsApp] Failed to update calendar event with name:", err);
          }
        }
      }
    }

    return twimlOk();
  } catch (error) {
    console.error("[WhatsApp] Incoming message error:", error);
    return twimlOk();
  }
}
