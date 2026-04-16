import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { getStripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/email/templates/welcome";
import { formatDutchPhone } from "@/lib/phone";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const VALID_PLANS = ["speed-leads", "website", "compleet"] as const;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const subAny = subscription as unknown as Record<string, unknown>;
      const periodEndTs = subAny.current_period_end as number | undefined;

      // Map Stripe status to our business status
      let status: string;
      let speedLeadsActive: boolean;

      switch (subscription.status) {
        case "trialing":
          status = "trialing";
          speedLeadsActive = true;
          break;
        case "active":
          status = "active";
          speedLeadsActive = true;
          break;
        case "past_due":
          status = "past_due";
          speedLeadsActive = false;
          break;
        case "canceled":
          // Cancelled but still within paid period — keep active until period ends
          status = "cancelled";
          speedLeadsActive = periodEndTs
            ? new Date(periodEndTs * 1000) > new Date()
            : false;
          break;
        default:
          status = "paused";
          speedLeadsActive = false;
      }

      const updateData: Record<string, unknown> = {
        status,
        stripe_subscription_id: subscription.id,
        speed_leads_active: speedLeadsActive,
      };

      // Store the subscription end date so we can deactivate when it expires
      if (periodEndTs) {
        updateData.subscription_ends_at = new Date(periodEndTs * 1000).toISOString();
      }

      await supabase
        .from("businesses")
        .update(updateData)
        .eq("stripe_customer_id", customerId);

      console.log(`[Stripe] Subscription ${subscription.id} → ${status}, speed_leads_active=${speedLeadsActive}`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const delSubAny = subscription as unknown as Record<string, unknown>;
      const delPeriodEndTs = delSubAny.current_period_end as number | undefined;

      // Subscription fully deleted — check if still within paid period
      const periodEnd = delPeriodEndTs
        ? new Date(delPeriodEndTs * 1000)
        : new Date();
      const stillActive = periodEnd > new Date();

      const { data: deletedBiz } = await supabase
        .from("businesses")
        .update({
          status: "cancelled",
          speed_leads_active: stillActive,
          subscription_ends_at: periodEnd.toISOString(),
        })
        .eq("stripe_customer_id", customerId)
        .select("id")
        .single();

      // Release pool number back when subscription is fully deleted
      if (deletedBiz) {
        const { releasePoolNumber } = await import("@/lib/twilio/pool");
        await releasePoolNumber(deletedBiz.id).catch((err) => {
          console.error("[Stripe] releasePoolNumber failed (non-fatal):", err);
        });
      }

      console.log(`[Stripe] Subscription ${subscription.id} deleted, active until ${periodEnd.toISOString()}`);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const paidCustomerId = invoice.customer as string;

      const { data: paidBiz } = await supabase
        .from("businesses")
        .update({
        status: "active",
        speed_leads_active: true,
        ...(invoice.billing_reason !== "subscription_create" ? { whatsapp_personal: true } : {}),
      })
        .eq("stripe_customer_id", paidCustomerId)
        .select("id, name")
        .single();

      console.log(`[Stripe] Invoice ${invoice.id} paid: €${(invoice.amount_paid / 100).toFixed(2)}${paidBiz ? ` for business ${paidBiz.id}` : ""}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Payment failed — deactivate service and release pool number immediately
      const { data: failedBiz } = await supabase
        .from("businesses")
        .update({ status: "past_due", speed_leads_active: false })
        .eq("stripe_customer_id", customerId)
        .select("id")
        .single();

      if (failedBiz) {
        const { releasePoolNumber } = await import("@/lib/twilio/pool");
        await releasePoolNumber(failedBiz.id).catch((err) => {
          console.error("[Stripe] releasePoolNumber failed (non-fatal):", err);
        });
      }

      console.log(`[Stripe] Invoice ${invoice.id} payment failed — service deactivated`);
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const metadata = session.metadata || {};

      // ─── Handle new signup (regular form) ─────────────
      if (metadata.signup_type === "regular") {
        await handleRegularSignup(session, metadata, supabase);
      }
      // ─── Handle Google OAuth signup ───────────────────
      else if (metadata.signup_type === "google") {
        await handleGoogleSignupComplete(metadata, supabase);
      }
      // ─── Handle admin-created signup ──────────────────
      else if (metadata.signup_type === "admin") {
        await handleAdminSignupComplete(session, metadata, supabase);
      }

      // ─── Update subscription status for all checkouts ─
      if (customerId && subscriptionId) {
        const stripeClient = getStripe();
        const sub = await stripeClient.subscriptions.retrieve(subscriptionId);
        const status = sub.status === "trialing" ? "trialing" : "active";

        await supabase
          .from("businesses")
          .update({
            status,
            stripe_subscription_id: subscriptionId,
            speed_leads_active: true,
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[Stripe] Checkout ${session.id} completed → ${status}`);
      }

      break;
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle regular (form) signup after checkout payment.
 * Creates auth user, business record, sends welcome email with magic link.
 */
async function handleRegularSignup(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const stripeCustomerId = typeof session.customer === "string"
    ? session.customer
    : "";

  // Validate email from metadata (server-set during checkout creation, but verify format as safeguard)
  const email = metadata.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("[Webhook] Invalid email in metadata:", email);
    return NextResponse.json({ received: true });
  }

  // Validate plan from metadata against allowed values
  const plan = VALID_PLANS.includes(metadata.plan as typeof VALID_PLANS[number])
    ? metadata.plan
    : "speed-leads";

  // 1. Create Supabase auth user (or find existing on retry)
  let userId: string;

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: metadata.firstName,
        business_name: metadata.businessName,
      },
    });

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      // Stripe retry — user exists but business might not
      console.log("[Webhook] User already exists, checking business");

      // Check if business already exists by email
      const { data: existingBiz } = await supabase
        .from("businesses")
        .select("id, owner_id")
        .eq("email", email)
        .maybeSingle();

      if (existingBiz) {
        console.log("[Webhook] Already fully provisioned (idempotent):", existingBiz.id);
        return;
      }

      // Business missing — find user ID via RPC (queries auth.users efficiently)
      const { data: foundUserId } = await supabase
        .rpc("get_user_id_by_email", { user_email: email });

      if (!foundUserId) {
        console.error("[Webhook] Could not find existing user for business creation (RPC returned null)");
        return;
      }
      userId = foundUserId;
      console.log("[Webhook] User exists but no business — creating business record");
    } else {
      console.error("[Webhook] Auth user creation failed:", authError);
      return;
    }
  } else {
    userId = authData.user.id;
  }

  // 2. Create business record
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({
      owner_id: userId,
      name: metadata.businessName,
      trade: metadata.trade,
      phone: formatDutchPhone(metadata.phone),
      email,
      plan,
      status: "trialing",
      speed_leads_active: true,
      trial_starts_at: new Date().toISOString(),
      subscription_ends_at: trialEndsAt.toISOString(),
      employees: metadata.employees || null,
      has_whatsapp: metadata.hasWhatsApp === "ja",
      has_website: metadata.hasWebsite === "ja",
      vat_number: metadata.vatNumber || null,
      address_line1: metadata.addressLine1 || null,
      postal_code: metadata.postalCode || null,
      city: metadata.city || null,
      country: metadata.country || null,
      monthly_leads: metadata.monthlyLeads || null,
      stripe_customer_id: stripeCustomerId,
      utm_source: metadata.utm_source || null,
      utm_medium: metadata.utm_medium || null,
      utm_campaign: metadata.utm_campaign || null,
      utm_term: metadata.utm_term || null,
      utm_content: metadata.utm_content || null,
      gclid: metadata.gclid || null,
      fbclid: metadata.fbclid || null,
      landing_page: metadata.landing_page || null,
      referrer: metadata.referrer || null,
    })
    .select()
    .single();

  if (bizError) {
    console.error("[Webhook] Business insert error:", bizError);
  }

  // 2b. Assign a number from pool or buy a new one
  if (business) {
    const { assignOrBuyNumber } = await import("@/lib/twilio/pool");
    await assignOrBuyNumber(business.id, metadata.businessName || "Speed Leads").catch((err) => {
      console.error("[Webhook] assignOrBuyNumber failed:", err);
    });
  }

  // 3. Send welcome email (user logs in via /login with Supabase magic link)
  await sendEmail({
    to: email,
    subject: `Welkom bij Speed Leads, ${metadata.firstName}!`,
    html: welcomeEmailHtml({
      firstName: metadata.firstName,
      businessName: metadata.businessName,
      portalUrl: `${APP_URL}/login`,
    }),
    text: welcomeEmailText({
      firstName: metadata.firstName,
      businessName: metadata.businessName,
      portalUrl: `${APP_URL}/login`,
    }),
  }).catch((err) => {
    console.error("[Webhook] Welcome email failed:", err);
  });

  // 4. Notify admin via WhatsApp
  if (process.env.ADMIN_PHONE) {
    try {
      const { sendWhatsApp } = await import("@/lib/twilio/whatsapp");
      const msg = [
        `Nieuwe aanmelding!`,
        ``,
        `Naam: ${metadata.firstName}`,
        `Bedrijf: ${metadata.businessName}`,
        `Vak: ${metadata.trade}`,
        `Plan: ${plan}`,
        `Email: ${email}`,
        `Telefoon: ${metadata.phone}`,
      ].join("\n");
      await sendWhatsApp(process.env.ADMIN_PHONE, msg);
    } catch (err) {
      console.error("[Webhook] Admin WhatsApp failed:", err);
    }
  }

  // 5. Send to CRM webhook
  if (process.env.WEBHOOK_URL) {
    await fetch(process.env.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify({
        type: "trial_signup",
        data: {
          userId,
          businessId: business?.id,
          firstName: metadata.firstName,
          businessName: metadata.businessName,
          email,
          phone: metadata.phone,
          trade: metadata.trade,
          plan,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error("[Webhook] CRM webhook failed:", err);
    });
  }

  console.log("[Webhook] Regular signup complete:", {
    userId,
    businessId: business?.id,
    plan,
  });
}

/**
 * Handle Google OAuth signup after checkout payment.
 * Business already exists with status "pending_payment" — activate trial and send welcome email.
 */
async function handleGoogleSignupComplete(
  metadata: Record<string, string>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const email = metadata.email;
  const firstName = metadata.firstName || "daar";
  const businessName = metadata.businessName || "";
  const businessId = metadata.businessId;

  // Payment confirmed — activate the trial period
  if (businessId) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await supabase
      .from("businesses")
      .update({
        status: "trialing",
        speed_leads_active: true,
        trial_starts_at: new Date().toISOString(),
        subscription_ends_at: trialEndsAt.toISOString(),
      })
      .eq("id", businessId);

    console.log("[Webhook] Google signup business activated:", businessId);

    // Assign a number from pool or buy a new one
    const { data: googleBiz } = await supabase
      .from("businesses")
      .select("name, twilio_number")
      .eq("id", businessId)
      .single();
    if (googleBiz && !googleBiz.twilio_number) {
      const { assignOrBuyNumber } = await import("@/lib/twilio/pool");
      await assignOrBuyNumber(businessId, googleBiz.name || "Speed Leads").catch((err) => {
        console.error("[Webhook] assignOrBuyNumber (Google) failed:", err);
      });
    }
  }

  // Send welcome email (Google users log in via /login)
  await sendEmail({
    to: email,
    subject: `Welkom bij Speed Leads${firstName !== "daar" ? `, ${firstName}` : ""}!`,
    html: welcomeEmailHtml({
      firstName,
      businessName,
      portalUrl: `${APP_URL}/login`,
    }),
    text: welcomeEmailText({
      firstName,
      businessName,
      portalUrl: `${APP_URL}/login`,
    }),
  }).catch((err) => {
    console.error("[Webhook] Welcome email failed:", err);
  });

  // Notify admin
  if (process.env.ADMIN_PHONE) {
    try {
      const { sendWhatsApp } = await import("@/lib/twilio/whatsapp");
      const msg = [
        `Nieuwe aanmelding (Google)!`,
        ``,
        `Naam: ${firstName}`,
        `Bedrijf: ${businessName}`,
        `Plan: ${metadata.plan}`,
        `Email: ${email}`,
      ].join("\n");
      await sendWhatsApp(process.env.ADMIN_PHONE, msg);
    } catch (err) {
      console.error("[Webhook] Admin WhatsApp failed:", err);
    }
  }

  console.log("[Webhook] Google signup email sent:", { plan: metadata.plan });
}

/**
 * Handle admin-created signup after checkout payment.
 * Business already exists with status "pending_payment" — activate trial and send welcome email.
 */
async function handleAdminSignupComplete(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, phone, email")
    .eq("id", metadata.businessId)
    .single();

  if (!business) {
    console.error("[Webhook] Admin signup: business not found:", metadata.businessId);
    return;
  }

  await supabase.from("businesses").update({
    status: "trialing",
    speed_leads_active: true,
    is_active: true,
    trial_starts_at: new Date().toISOString(),
    subscription_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    stripe_subscription_id: session.subscription,
  }).eq("id", business.id);

  // Welcome email
  try {
    await sendEmail({
      to: business.email,
      subject: "Welkom bij Speed Leads!",
      html: welcomeEmailHtml({
        firstName: metadata.firstName || business.name,
        businessName: business.name,
        portalUrl: `${APP_URL}/login`,
      }),
      text: welcomeEmailText({
        firstName: metadata.firstName || business.name,
        businessName: business.name,
        portalUrl: `${APP_URL}/login`,
      }),
    });
  } catch (err) {
    console.error("[Webhook] Admin welcome email failed:", err);
  }

  // Notify admin
  const ADMIN_PHONE = process.env.ADMIN_PHONE;
  if (ADMIN_PHONE) {
    const { sendWhatsApp } = await import("@/lib/twilio/whatsapp");
    sendWhatsApp(ADMIN_PHONE, `Nieuwe klant betaald! ${business.name} (${business.phone})`).catch(() => {});
  }

  console.log(`[Webhook] Admin signup completed for business ${business.id}`);
}
