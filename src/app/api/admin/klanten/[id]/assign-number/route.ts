import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assignOrBuyNumber } from "@/lib/twilio/pool";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/** POST — Assign a Twilio number to a business */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: business } = await serviceSupabase
    .from("businesses")
    .select("id, name, twilio_number")
    .eq("id", params.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  if (business.twilio_number) {
    return NextResponse.json({ error: "Heeft al een nummer", number: business.twilio_number }, { status: 400 });
  }

  try {
    const number = await assignOrBuyNumber(business.id, business.name);
    if (!number) {
      return NextResponse.json({ error: "Geen nummer beschikbaar" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, number });
  } catch (error) {
    console.error("[Admin] Assign number error:", error);
    return NextResponse.json({ error: "Toewijzen mislukt" }, { status: 500 });
  }
}
