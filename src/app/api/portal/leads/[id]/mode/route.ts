import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
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
    .select("id")
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
    .select("id, business_id")
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
  const { mode } = await request.json();

  if (mode !== "ai" && mode !== "manual") {
    return NextResponse.json(
      { error: "Ongeldige modus. Gebruik 'ai' of 'manual'." },
      { status: 400 }
    );
  }

  // 5. Update conversation_mode on the lead
  const updateData: Record<string, unknown> = { conversation_mode: mode };
  if (mode === "manual") {
    updateData.manual_mode_at = new Date().toISOString();
  } else {
    updateData.manual_mode_at = null;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", id)
    .eq("business_id", business.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Kon modus niet wijzigen" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
