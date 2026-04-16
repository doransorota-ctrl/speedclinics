import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySetupToken } from "@/lib/setup-token";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import type { PlanType } from "@/lib/stripe/prices";

/** GET — Passwordless Stripe checkout via setup token */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://clyniq.nl";

  if (!token) {
    return NextResponse.redirect(`${origin}/setup/betalen?status=error`);
  }

  const result = verifySetupToken(token);
  if (!result) {
    return NextResponse.redirect(`${origin}/setup/betalen?status=expired`);
  }

  const supabase = createServiceRoleClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, phone, stripe_customer_id, plan")
    .eq("twilio_number", result.number)
    .single();

  if (!business || !business.stripe_customer_id) {
    return NextResponse.redirect(`${origin}/setup/betalen?status=error`);
  }

  try {
    const session = await createCheckoutSession({
      customerId: business.stripe_customer_id,
      plan: (business.plan || "speed-leads") as PlanType,
      successUrl: `${origin}/login?payment=success`,
      cancelUrl: origin,
      metadata: {
        signup_type: "admin",
        businessId: business.id,
      },
    });

    if (!session.url) {
      return NextResponse.redirect(`${origin}/setup/betalen?status=error`);
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("[Setup] Checkout redirect error:", error);
    return NextResponse.redirect(`${origin}/setup/betalen?status=error`);
  }
}
