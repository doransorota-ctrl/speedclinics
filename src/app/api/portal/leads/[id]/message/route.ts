import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/twilio/whatsapp";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  // 1. Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  // 2. Find their business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, whatsapp_personal, twilio_number")
    .eq("owner_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json(
      { error: "Bedrijf niet gevonden" },
      { status: 404 }
    );
  }

  // 3. Verify lead belongs to this business
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, business_id, customer_phone")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json(
      { error: "Lead niet gevonden" },
      { status: 404 }
    );
  }

  // 4. Parse request body
  const { body, mediaUrl } = await request.json();

  if ((!body || typeof body !== "string" || body.trim().length === 0) && !mediaUrl) {
    return NextResponse.json(
      { error: "Bericht mag niet leeg zijn" },
      { status: 400 }
    );
  }

  // Validate mediaUrl to prevent SSRF
  if (mediaUrl) {
    try {
      const parsed = new URL(mediaUrl);
      if (parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Media URL moet HTTPS zijn" }, { status: 400 });
      }
      const blocked = ["localhost", "127.", "169.254.", "10.", "172.16.", "192.168.", "0.0.0.0"];
      if (blocked.some(b => parsed.hostname.startsWith(b))) {
        return NextResponse.json({ error: "Ongeldige media URL" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Ongeldige media URL" }, { status: 400 });
    }
  }

  if (body.trim().length > 1600) {
    return NextResponse.json(
      { error: "Bericht is te lang (max 1600 tekens)" },
      { status: 400 }
    );
  }

  // 5. Insert message
  const messageBody = body?.trim() || "";
  const mediaUrls: string[] = mediaUrl ? [mediaUrl] : [];
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      lead_id: id,
      business_id: business.id,
      sender: "owner",
      body: mediaUrls.length > 0 ? (messageBody || `[Bijlage: ${mediaUrl}]`) : messageBody,
      channel: "whatsapp",
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json(
      { error: "Kon bericht niet opslaan" },
      { status: 500 }
    );
  }

  // 6. Actually send via WhatsApp
  try {
    const twilioMsg = await sendWhatsApp(lead.customer_phone, messageBody || " ", business.whatsapp_personal ? business.twilio_number : undefined, mediaUrls.length > 0 ? mediaUrls : undefined);
    if (twilioMsg?.sid) {
      await supabase
        .from("messages")
        .update({ twilio_sid: twilioMsg.sid })
        .eq("id", message.id);
    }
  } catch (err) {
    console.error("[Message] WhatsApp send failed:", err);
    return NextResponse.json(
      { error: "Bericht opgeslagen maar kon niet via WhatsApp versturen" },
      { status: 502 }
    );
  }

  return NextResponse.json(message);
}
