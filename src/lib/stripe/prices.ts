/**
 * Stripe price IDs — set via environment variables.
 * Create these in the Stripe Dashboard → Products → Prices.
 */
export const STRIPE_PRICES = {
  "speed-leads": {
    monthly: process.env.STRIPE_PRICE_SPEED_LEADS_MONTHLY ?? "",
    trialDays: 14,
  },
  website: {
    onetime: process.env.STRIPE_PRICE_WEBSITE_ONETIME ?? "",
    hosting: process.env.STRIPE_PRICE_HOSTING_MONTHLY ?? "",
    trialDays: 0,
  },
  compleet: {
    onetime: process.env.STRIPE_PRICE_WEBSITE_ONETIME ?? "",
    monthly: process.env.STRIPE_PRICE_COMPLEET_MONTHLY ?? "",
    trialDays: 14,
  },
} as const;

export type PlanType = keyof typeof STRIPE_PRICES;
