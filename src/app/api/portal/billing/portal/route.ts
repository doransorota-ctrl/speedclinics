import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/lib/stripe/checkout";
import { getStripe } from "@/lib/stripe/client";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, stripe_customer_id, name, email")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 400 });
    }

    let stripeCustomerId = business.stripe_customer_id;

    // Create Stripe customer if one doesn't exist yet
    if (!stripeCustomerId) {
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: business.email || user.email || "",
        name: business.name || "",
        metadata: {
          business_id: business.id,
          user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from("businesses")
        .update({ stripe_customer_id: customer.id })
        .eq("id", business.id);
    }

    const session = await createCustomerPortalSession(
      stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
