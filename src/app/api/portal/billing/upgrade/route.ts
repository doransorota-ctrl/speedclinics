import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { STRIPE_PRICES, type PlanType } from "@/lib/stripe/prices";

/**
 * POST /api/portal/billing/upgrade
 * Upgrades a customer's subscription using Stripe proration.
 * Adds one-time website fee if upgrading from speed-leads to website/compleet.
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await request.json();
    const newPlan = body.plan as PlanType;
    if (!newPlan || !["speed-leads", "website", "compleet"].includes(newPlan)) {
      return NextResponse.json({ error: "Ongeldig pakket" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, plan, stripe_customer_id, stripe_subscription_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }
    if (business.plan === newPlan) {
      return NextResponse.json({ error: "Je hebt dit pakket al" }, { status: 400 });
    }
    if (business.plan === "compleet") {
      return NextResponse.json({ error: "Je hebt al het Compleet pakket" }, { status: 400 });
    }
    if (!business.stripe_customer_id || !business.stripe_subscription_id) {
      return NextResponse.json({ error: "Geen actief abonnement gevonden" }, { status: 400 });
    }

    const stripeClient = getStripe();

    // Get current subscription
    const subscription = await stripeClient.subscriptions.retrieve(business.stripe_subscription_id);
    const recurringItem = subscription.items.data.find(
      (item) => item.price.recurring !== null
    );
    if (!recurringItem) {
      return NextResponse.json({ error: "Geen terugkerend abonnement gevonden" }, { status: 400 });
    }

    // Determine new monthly price
    let newMonthlyPrice: string;
    if (newPlan === "compleet") {
      newMonthlyPrice = STRIPE_PRICES.compleet.monthly;
    } else if (newPlan === "speed-leads") {
      newMonthlyPrice = STRIPE_PRICES["speed-leads"].monthly;
    } else {
      newMonthlyPrice = STRIPE_PRICES.website.hosting;
    }
    if (!newMonthlyPrice) {
      return NextResponse.json({ error: "Prijsconfiguratie ontbreekt" }, { status: 500 });
    }

    // Build subscription update items
    const updateItems: { id: string; price: string }[] = [
      { id: recurringItem.id, price: newMonthlyPrice },
    ];

    // Add one-time website fee as a new subscription item if upgrading FROM speed-leads
    if ((newPlan === "website" || newPlan === "compleet") && business.plan === "speed-leads") {
      const onetimePrice = STRIPE_PRICES.website.onetime;
      if (onetimePrice) {
        updateItems.push({ id: "", price: onetimePrice } as unknown as { id: string; price: string });
      }
    }

    // Update subscription with proration
    await stripeClient.subscriptions.update(business.stripe_subscription_id, {
      items: updateItems.length === 1
        ? [{ id: recurringItem.id, price: newMonthlyPrice }]
        : [
            { id: recurringItem.id, price: newMonthlyPrice },
            { price: STRIPE_PRICES.website.onetime }, // adds as new line item
          ],
      proration_behavior: "create_prorations",
    });

    // Update business plan in database
    const admin = createServiceRoleClient();
    await admin
      .from("businesses")
      .update({ plan: newPlan })
      .eq("id", business.id);

    console.log(`[Upgrade] ${business.id}: ${business.plan} → ${newPlan}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Upgrade] Error:", error);
    return NextResponse.json({ error: "Upgrade mislukt" }, { status: 500 });
  }
}
