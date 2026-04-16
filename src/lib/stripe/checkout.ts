import { stripe } from "./client";
import { STRIPE_PRICES, type PlanType } from "./prices";

interface CreateCheckoutOptions {
  customerId?: string;
  customerEmail?: string;
  plan: PlanType;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession({
  customerId,
  customerEmail,
  plan,
  successUrl,
  cancelUrl,
  metadata,
}: CreateCheckoutOptions) {
  const lineItems: { price: string; quantity: number }[] = [];
  let trialDays: number | undefined;

  if (plan === "speed-leads") {
    const p = STRIPE_PRICES["speed-leads"];
    if (!p.monthly) throw new Error("Missing STRIPE_PRICE_SPEED_LEADS_MONTHLY env var");
    lineItems.push({ price: p.monthly, quantity: 1 });
    trialDays = p.trialDays;
  } else if (plan === "website") {
    const p = STRIPE_PRICES["website"];
    if (!p.onetime) throw new Error("Missing STRIPE_PRICE_WEBSITE_ONETIME env var");
    if (!p.hosting) throw new Error("Missing STRIPE_PRICE_HOSTING_MONTHLY env var");
    lineItems.push({ price: p.onetime, quantity: 1 });
    lineItems.push({ price: p.hosting, quantity: 1 });
  } else if (plan === "compleet") {
    const p = STRIPE_PRICES["compleet"];
    if (!p.onetime) throw new Error("Missing STRIPE_PRICE_WEBSITE_ONETIME env var");
    if (!p.monthly) throw new Error("Missing STRIPE_PRICE_COMPLEET_MONTHLY env var");
    lineItems.push({ price: p.onetime, quantity: 1 });
    lineItems.push({ price: p.monthly, quantity: 1 });
    trialDays = p.trialDays;
  }

  console.log("[Stripe] Creating checkout:", { plan, lineItems: lineItems.map(l => l.price), trialDays });

  const session = await stripe.checkout.sessions.create({
    // Use existing customer or let Stripe create one from email
    ...(customerId
      ? { customer: customerId, customer_update: { address: "auto", name: "auto" } }
      : { customer_email: customerEmail }),
    mode: "subscription",
    line_items: lineItems,
    subscription_data: trialDays
      ? { trial_period_days: trialDays }
      : undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: "nl",
    payment_method_types: ["ideal", "card"],
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    ...(metadata ? { metadata } : {}),
  });

  return session;
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}
