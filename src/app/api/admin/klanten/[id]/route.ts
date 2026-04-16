import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

async function checkAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && user.id === ADMIN_USER_ID;
}

/** GET — Single business detail */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: business, error } = await serviceSupabase
    .from("businesses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !business) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  // Check if calendar is connected
  const { data: calToken } = await serviceSupabase
    .from("google_calendar_tokens")
    .select("id")
    .eq("business_id", params.id)
    .maybeSingle();

  return NextResponse.json({
    ...business,
    calendarConnected: !!calToken,
  });
}

const ADMIN_PATCHABLE_FIELDS = new Set([
  "name", "trade", "phone", "email", "service_area", "plan", "status",
  "speed_leads_active", "is_active", "has_whatsapp", "has_website",
  "calendar_type", "available_hours", "slot_duration_minutes",
  "max_appointments_per_day", "prompt_mode", "demo_followup_message",
  "onboarding_step", "forwarding_confirmed", "google_review_link",
  "website_url", "subscription_ends_at", "trial_starts_at",
]);

/** PATCH — Update allowed business fields */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  // Filter to allowed fields only — block owner_id, stripe_*, twilio_number
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (ADMIN_PATCHABLE_FIELDS.has(key)) update[key] = value;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Geen geldige velden" }, { status: 400 });
  }

  const serviceSupabase = createServiceRoleClient();

  const { data, error } = await serviceSupabase
    .from("businesses")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    console.error("[Admin] Update business failed:", error);
    return NextResponse.json({ error: "Update mislukt" }, { status: 500 });
  }

  return NextResponse.json(data);
}
