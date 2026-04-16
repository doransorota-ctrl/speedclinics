import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { releasePoolNumber } from "@/lib/twilio/pool";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/** DELETE — Delete a business, release their number, and remove all related data */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: business } = await serviceSupabase
    .from("businesses")
    .select("id, owner_id, twilio_number, stripe_subscription_id")
    .eq("id", params.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Klant niet gevonden" }, { status: 404 });
  }

  try {
    // 1. Release Twilio number back to pool
    if (business.twilio_number) {
      await releasePoolNumber(business.id);
    }

    // 2. Cancel Stripe subscription if active
    if (business.stripe_subscription_id) {
      try {
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);
        await stripeClient.subscriptions.cancel(business.stripe_subscription_id);
      } catch (err) {
        console.error("[Admin Delete] Stripe cancel failed (non-fatal):", err);
      }
    }

    // 3. Delete child records (order matters — foreign keys)
    // Messages reference leads, so delete first
    const { data: leadIds } = await serviceSupabase
      .from("leads")
      .select("id")
      .eq("business_id", business.id);

    if (leadIds && leadIds.length > 0) {
      const ids = leadIds.map((l) => l.id);
      await serviceSupabase.from("messages").delete().in("lead_id", ids);
      await serviceSupabase.from("ai_contexts").delete().in("lead_id", ids);
    }

    await serviceSupabase.from("leads").delete().eq("business_id", business.id);
    await serviceSupabase.from("google_calendar_tokens").delete().eq("business_id", business.id);
    await serviceSupabase.from("google_oauth_states").delete().eq("business_id", business.id);

    // 4. Delete the business record
    await serviceSupabase.from("businesses").delete().eq("id", business.id);

    // 5. Delete the auth user
    if (business.owner_id) {
      await serviceSupabase.auth.admin.deleteUser(business.owner_id);
    }

    console.log(`[Admin Delete] Deleted business ${business.id} and user ${business.owner_id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Delete] Error:", error);
    return NextResponse.json({ error: "Verwijderen mislukt" }, { status: 500 });
  }
}
