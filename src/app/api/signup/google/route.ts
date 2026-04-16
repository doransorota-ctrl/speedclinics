import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { googleSignupSchema } from "@/lib/validation";
import type { PlanType } from "@/lib/stripe/prices";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { formatDutchPhone } from "@/lib/phone";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 signups per IP per minute
    const ip = getClientIp(request);
    if (isRateLimited(`google-signup:${ip}`, 5)) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 }
      );
    }
    // Get the authenticated user from the session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Niet ingelogd. Log opnieuw in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const result = googleSignupSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { businessName, phone, trade, employees, vatNumber, addressLine1, postalCode, city, country, plan } = result.data;

    const serviceClient = createServiceRoleClient();

    // Check if business already exists
    const { data: existingBusiness } = await serviceClient
      .from("businesses")
      .select("id, status, stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingBusiness) {
      // If stuck in trialing with no Stripe customer, clean up and allow retry
      if (existingBusiness.status === "trialing" && !existingBusiness.stripe_customer_id) {
        await serviceClient.from("businesses").delete().eq("id", existingBusiness.id);
        // Fall through to create new business
      } else {
        return NextResponse.json(
          { error: "Je hebt al een account. Ga naar het portaal." },
          { status: 409 }
        );
      }
    }

    // Verify phone was OTP-verified (stored in user_metadata, survives deploys)
    const phoneVerifiedAt = user.user_metadata?.phone_verified_at;
    const verifiedPhone = user.user_metadata?.verified_phone;
    const isPhoneRecent = phoneVerifiedAt && (Date.now() - new Date(phoneVerifiedAt).getTime()) < 30 * 60_000;
    if (!isPhoneRecent || verifiedPhone !== formatDutchPhone(result.data.phone)) {
      console.warn(`[Signup] Phone verification mismatch for user ${user.id}`);
      // Soft check for now — don't block
    }

    // Create business record (trialing until Stripe checkout completes)
    const firstName =
      user.user_metadata?.full_name?.split(" ")[0] ||
      user.user_metadata?.first_name ||
      "";

    const { data: business, error: bizError } = await serviceClient
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: businessName,
        trade,
        phone: formatDutchPhone(phone),
        email: user.email,
        plan,
        status: "trialing",
        speed_leads_active: false,
        employees: employees || null,
        vat_number: vatNumber || null,
        address_line1: addressLine1,
        postal_code: postalCode,
        city,
        country,
      })
      .select()
      .single();

    if (bizError) {
      console.error("Business insert error:", bizError);
      return NextResponse.json(
        { error: "Er ging iets mis bij het aanmaken van je bedrijf." },
        { status: 500 }
      );
    }

    // Twilio number is provisioned after Stripe payment in the webhook handler

    // Create Stripe customer + checkout session
    let checkoutUrl: string | null = null;

    try {
      const stripeClient = getStripe();
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: businessName,
        address: {
          line1: addressLine1,
          postal_code: postalCode,
          city,
          country,
        },
        metadata: {
          business_id: business.id,
          user_id: user.id,
        },
      });

      const { error: stripeUpdateErr } = await serviceClient
        .from("businesses")
        .update({ stripe_customer_id: customer.id })
        .eq("id", business.id);

      if (stripeUpdateErr) {
        console.error("Failed to save stripe_customer_id:", stripeUpdateErr);
      }

      const needsIntake = plan === "website" || plan === "compleet";
      const successUrl = needsIntake
        ? `${APP_URL}/website/bedankt`
        : `${APP_URL}/portal/billing?success=true`;

      const session = await createCheckoutSession({
        customerId: customer.id,
        plan: plan as PlanType,
        successUrl,
        cancelUrl: `${APP_URL}/aanmelden/profiel`,
        metadata: {
          signup_type: "google",
          firstName,
          businessName,
          email: user.email || "",
          plan,
          businessId: business.id,
        },
      });

      checkoutUrl = session.url;
    } catch (stripeErr) {
      console.error("Stripe checkout creation failed:", stripeErr);
    }

    console.log("[Signup] Google signup complete:", {
      userId: user.id,
      businessId: business.id,
      plan,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        businessId: business.id,
        plan,
        checkoutUrl,
      },
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
