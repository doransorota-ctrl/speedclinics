import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendNamedTemplate } from "@/lib/twilio/whatsapp";
import { createSetupToken } from "@/lib/setup-token";

const TEMPLATE_SID = process.env.TEMPLATE_SETUP_FORWARDING || process.env.TEMPLATE_FORWARDING_SETUP;

/**
 * POST /api/portal/onboarding/send-setup-link
 * Sends a WhatsApp template with a temporary setup link containing tel: dial buttons.
 */
export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!TEMPLATE_SID) {
      return Response.json({ error: "Forwarding template niet geconfigureerd" }, { status: 500 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("phone, name, twilio_number")
      .eq("owner_id", user.id)
      .single();

    if (!business?.phone) {
      return Response.json({ error: "Geen telefoonnummer gevonden" }, { status: 400 });
    }

    if (!business.twilio_number) {
      return Response.json({ error: "Je clŷniq nummer is nog niet klaar. Probeer het opnieuw." }, { status: 400 });
    }

    const token = createSetupToken(business.twilio_number);

    await sendNamedTemplate(business.phone, TEMPLATE_SID, { "1": token });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Onboarding/SendSetupLink] Error:", error);
    return Response.json({ error: "Bericht versturen mislukt" }, { status: 500 });
  }
}
