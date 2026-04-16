import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { formatDutchPhone } from "@/lib/phone";
import { assignOrBuyNumber } from "@/lib/twilio/pool";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { createSetupToken } from "@/lib/setup-token";
import { stripe } from "@/lib/stripe/client";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://clyniq.nl";

async function isAdmin(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && user.id === ADMIN_USER_ID;
}

/** GET — List all businesses */
export async function GET() {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data, error } = await serviceSupabase
    .from("businesses")
    .select("id, name, trade, phone, email, status, plan, twilio_number, forwarding_confirmed, calendar_type, created_at, subscription_ends_at, speed_leads_active, onboarding_completed_at, website_url, has_website")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Kon klanten niet ophalen" }, { status: 500 });

  // Check which businesses have calendar tokens
  const businessIds = (data || []).map((b: { id: string }) => b.id);
  const { data: calTokens } = await serviceSupabase
    .from("google_calendar_tokens")
    .select("business_id")
    .in("business_id", businessIds);

  const calConnected = new Set((calTokens || []).map((t: { business_id: string }) => t.business_id));

  const enriched = (data || []).map((b: { id: string; [key: string]: unknown }) => ({
    ...b,
    calendarConnected: calConnected.has(b.id),
  }));

  return NextResponse.json(enriched);
}

/** POST — Create new customer */
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contactName, businessName, phone, email, trade, serviceArea, plan, googleReviewLink, slotDuration, maxAppointments } = body;

    if (!contactName || !businessName || !phone || !email || !trade) {
      return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
    }

    const formatted = formatDutchPhone(phone);
    if (!formatted.startsWith("+31")) {
      return NextResponse.json({ error: "Ongeldig telefoonnummer" }, { status: 400 });
    }

    const serviceSupabase = createServiceRoleClient();

    // 1. Create Supabase auth user (no email sent)
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: contactName },
    });

    if (authError) {
      // User might already exist
      if (authError.message?.includes("already")) {
        return NextResponse.json({ error: "Er bestaat al een account met dit emailadres" }, { status: 409 });
      }
      console.error("[Admin] Create user failed:", authError);
      return NextResponse.json({ error: "Account aanmaken mislukt" }, { status: 500 });
    }

    // 2. Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: businessName,
      phone: formatted,
      metadata: { source: "admin" },
    });

    // 3. Create business record
    const { data: business, error: bizError } = await serviceSupabase
      .from("businesses")
      .insert({
        owner_id: authData.user.id,
        name: businessName,
        trade,
        phone: formatted,
        email,
        plan: plan || "speed-leads",
        status: "pending_payment",
        speed_leads_active: false,
        is_active: false,
        stripe_customer_id: stripeCustomer.id,
        service_area: serviceArea || null,
        google_review_link: googleReviewLink || null,
        slot_duration_minutes: slotDuration || 120,
        max_appointments_per_day: maxAppointments || 4,
      })
      .select("id")
      .single();

    if (bizError || !business) {
      console.error("[Admin] Create business failed:", bizError);
      return NextResponse.json({ error: "Bedrijf aanmaken mislukt" }, { status: 500 });
    }

    // 4. Assign Twilio number
    let twilioNumber: string | null = null;
    try {
      twilioNumber = await assignOrBuyNumber(business.id, businessName);
    } catch (err) {
      console.error("[Admin] Assign number failed:", err);
    }

    // 5. Generate Stripe checkout link
    const session = await createCheckoutSession({
      customerId: stripeCustomer.id,
      plan: (plan || "speed-leads") as "speed-leads" | "website" | "compleet",
      successUrl: `${APP_URL}/login?payment=success`,
      cancelUrl: APP_URL,
      metadata: {
        signup_type: "admin",
        businessId: business.id,
        email,
        firstName: contactName,
        businessName,
        phone: formatted,
        trade,
      },
    });

    // 6. Generate setup links
    const setupToken = twilioNumber ? createSetupToken(twilioNumber) : null;

    return NextResponse.json({
      businessId: business.id,
      twilioNumber,
      checkoutUrl: session.url,
      calendarUrl: setupToken ? `${APP_URL}/setup/agenda?t=${setupToken}` : null,
      forwardingUrl: setupToken ? `${APP_URL}/setup/doorschakelen?t=${setupToken}` : null,
    });
  } catch (error) {
    console.error("[Admin] Create customer error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
