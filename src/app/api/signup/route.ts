import { NextResponse } from "next/server";
import { trialSignupSchema } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { stripe } from "@/lib/stripe/client";
import type { PlanType } from "@/lib/stripe/prices";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 signups per IP per minute
    const ip = getClientIp(request);
    if (isRateLimited(`signup:${ip}`, 5)) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check — bots fill hidden fields
    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    // Validate
    const result = trialSignupSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = result.data;
    const supabase = createServiceRoleClient();

    // ─── 1. Check if email is already registered ────────
    const { data: existingBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existingBiz) {
      return NextResponse.json(
        { error: "Dit e-mailadres is al geregistreerd. Probeer in te loggen." },
        { status: 409 }
      );
    }

    // ─── 2. Create Stripe customer with address for tax calc ─
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.businessName,
      address: {
        line1: data.addressLine1,
        postal_code: data.postalCode,
        city: data.city,
        country: data.country,
      },
      ...(data.vatNumber
        ? { tax_id_data: [{ type: "eu_vat", value: data.vatNumber }] }
        : {}),
    });

    // ─── 3. Create checkout session ──────────────────────
    const plan = data.plan;
    const needsIntake = plan === "website" || plan === "compleet";
    const successUrl = needsIntake
      ? `${APP_URL}/website/bedankt`
      : `${APP_URL}/login?payment=success`;

    const session = await createCheckoutSession({
      customerId: customer.id,
      plan: plan as PlanType,
      successUrl,
      cancelUrl: `${APP_URL}/aanmelden?plan=${plan}`,
      metadata: {
        signup_type: "regular",
        firstName: data.firstName,
        businessName: data.businessName,
        email: data.email,
        phone: data.phone,
        trade: data.trade,
        employees: data.employees,
        hasWhatsApp: data.hasWhatsApp,
        hasWebsite: data.hasWebsite,
        monthlyLeads: data.monthlyLeads || "",
        vatNumber: data.vatNumber || "",
        addressLine1: data.addressLine1,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        plan,
        utm_source: data.utm_source || "",
        utm_medium: data.utm_medium || "",
        utm_campaign: data.utm_campaign || "",
        utm_term: data.utm_term || "",
        utm_content: data.utm_content || "",
        gclid: (data.gclid || "").slice(0, 500),
        fbclid: (data.fbclid || "").slice(0, 500),
        landing_page: (data.landing_page || "").slice(0, 500),
        referrer: (data.referrer || "").slice(0, 500),
      },
    });

    console.log("[Signup] Checkout session created:", {
      plan,
      sessionId: session.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
