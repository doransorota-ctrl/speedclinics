import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { releasePoolNumber } from "@/lib/twilio/pool";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/** POST — Release a business's Twilio number back to the pool */
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
    .select("id, twilio_number")
    .eq("id", params.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  if (!business.twilio_number) {
    return NextResponse.json({ error: "Heeft geen nummer" }, { status: 400 });
  }

  try {
    await releasePoolNumber(business.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin] Release number error:", error);
    return NextResponse.json({ error: "Vrijgeven mislukt" }, { status: 500 });
  }
}
