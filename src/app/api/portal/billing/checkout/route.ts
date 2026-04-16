import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import type { PlanType } from "@/lib/stripe/prices";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, email, plan, stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    let customerId = business.stripe_customer_id;

    if (!customerId) {
      const stripeClient = getStripe();
      const customer = await stripeClient.customers.create({
        email: business.email,
        name: business.name,
        metadata: { business_id: business.id },
      });
      customerId = customer.id;

      const adminSupabase = createServiceRoleClient();
      await adminSupabase
        .from("businesses")
        .update({ stripe_customer_id: customerId })
        .eq("id", business.id);
    }

    const session = await createCheckoutSession({
      customerId,
      plan: (business.plan || "speed-leads") as PlanType,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
