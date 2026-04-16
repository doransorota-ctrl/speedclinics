import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assignOrBuyNumber } from "@/lib/twilio/pool";

/**
 * POST /api/portal/onboarding/assign-number
 * Assigns an available pool number or buys a new one for businesses that don't have one yet.
 */
export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, twilio_number")
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return Response.json({ error: "No business found" }, { status: 404 });
    }

    if (business.twilio_number) {
      return Response.json({ ok: true, phone: business.twilio_number });
    }

    const number = await assignOrBuyNumber(business.id, business.name || "clŷniq");
    if (!number) {
      return Response.json(
        { error: "Geen nummers beschikbaar. Probeer het later opnieuw." },
        { status: 503 }
      );
    }

    return Response.json({ ok: true, phone: number });
  } catch (error) {
    console.error("[AssignNumber] Error:", error);
    return Response.json(
      { error: "Nummer toewijzen mislukt: " + (error instanceof Error ? error.message : "onbekende fout") },
      { status: 500 }
    );
  }
}
