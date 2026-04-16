import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();

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
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json(
      { error: "Bedrijf niet gevonden" },
      { status: 404 }
    );
  }

  // 3. Fetch leads ordered by created_at desc
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, customer_phone, customer_name, source, status, conversation_mode, problem_summary, urgency, appointment_start, appointment_end, flagged, created_at, updated_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (leadsError) {
    return NextResponse.json(
      { error: "Kon leads niet ophalen" },
      { status: 500 }
    );
  }

  // Check which leads have customer messages (= actually responded)
  const leadsWithResponse = await Promise.all(
    (leads ?? []).map(async (lead) => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("sender", "customer");
      return { ...lead, has_customer_response: (count || 0) > 0 };
    })
  );

  return NextResponse.json(leadsWithResponse);
}
