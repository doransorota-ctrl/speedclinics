import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/twilio/whatsapp";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/** POST — Send custom WhatsApp message to business owner */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { message } = await request.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Bericht is verplicht" }, { status: 400 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: business } = await serviceSupabase
    .from("businesses")
    .select("phone")
    .eq("id", params.id)
    .single();

  if (!business?.phone) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  try {
    await sendWhatsApp(business.phone, message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin] WhatsApp send error:", error);
    return NextResponse.json({ error: "Versturen mislukt" }, { status: 500 });
  }
}
