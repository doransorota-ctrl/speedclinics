import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsApp, sendNamedTemplate, TEMPLATES } from "@/lib/twilio/whatsapp";
import { createSetupToken } from "@/lib/setup-token";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://clyniq.nl";

/** POST — Send setup links via WhatsApp */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { type } = await request.json();
  if (!["checkout", "calendar", "forwarding", "all"].includes(type)) {
    return NextResponse.json({ error: "Ongeldig type" }, { status: 400 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: business } = await serviceSupabase
    .from("businesses")
    .select("id, name, phone, twilio_number, stripe_customer_id, plan")
    .eq("id", params.id)
    .single();

  if (!business || !business.phone) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  if (!business.twilio_number) {
    return NextResponse.json({ error: "Geen Twilio nummer toegewezen" }, { status: 400 });
  }

  const sent: string[] = [];
  const token = createSetupToken(business.twilio_number);

  try {
    // Checkout link — uses setup token, redirects to Stripe via /api/setup/checkout
    if (type === "checkout" || type === "all") {
      const url = `${APP_URL}/setup/betalen?t=${token}`;

      if (TEMPLATES.SETUP_CHECKOUT) {
        await sendNamedTemplate(business.phone, TEMPLATES.SETUP_CHECKOUT, { "1": token });
      } else {
        await sendWhatsApp(
          business.phone,
          `Hey, hier is je betaallink voor Clŷniq. 14 dagen gratis, daarna €79/maand. Opzeggen kan altijd.\n\n${url}`
        );
      }
      sent.push("checkout");
    }

    // Calendar link
    if (type === "calendar" || type === "all") {
      const url = `${APP_URL}/setup/agenda?t=${token}`;
      if (type === "all") await new Promise((r) => setTimeout(r, 1000));

      if (TEMPLATES.SETUP_CALENDAR) {
        await sendNamedTemplate(business.phone, TEMPLATES.SETUP_CALENDAR, { "1": token });
      } else {
        await sendWhatsApp(
          business.phone,
          `Koppel je Google Agenda zodat afspraken er automatisch in komen:\n\n${url}`
        );
      }
      sent.push("calendar");
    }

    // Forwarding link
    if (type === "forwarding" || type === "all") {
      const url = `${APP_URL}/setup/doorschakelen?t=${token}`;
      if (type === "all") await new Promise((r) => setTimeout(r, 1000));

      if (TEMPLATES.SETUP_FORWARDING) {
        await sendNamedTemplate(business.phone, TEMPLATES.SETUP_FORWARDING, { "1": token });
      } else {
        await sendWhatsApp(
          business.phone,
          `Laatste stap! Stel doorschakelen in door op de twee knoppen te tikken:\n\n${url}`
        );
      }
      sent.push("forwarding");
    }

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error("[Admin] Send links error:", error);
    return NextResponse.json({ error: "Versturen mislukt" }, { status: 500 });
  }
}
