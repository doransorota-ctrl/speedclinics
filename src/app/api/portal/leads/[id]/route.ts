import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
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

  // 3. Fetch lead by id and verify it belongs to this business
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, business_id, customer_phone, customer_name, source, status, conversation_mode, problem_summary, problem_details, address, urgency, appointment_start, appointment_end, first_response_at, created_at, updated_at")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json(
      { error: "Lead niet gevonden" },
      { status: 404 }
    );
  }

  // 4. Fetch messages for this lead ordered by created_at asc
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, lead_id, sender, body, channel, twilio_status, created_at")
    .eq("lead_id", id)
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return NextResponse.json(
      { error: "Kon berichten niet ophalen" },
      { status: 500 }
    );
  }

  return NextResponse.json({ lead, messages: messages ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });

  const body = await request.json();
  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const allowed = ["active", "qualified", "lost", "archived"];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.flagged !== undefined) {
    update.flagged = !!body.flagged;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Geen updates" }, { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return NextResponse.json({ error: "Kon status niet updaten" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
