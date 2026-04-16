import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripe();
    const stripeInvoices = await stripe.invoices.list({
      customer: business.stripe_customer_id,
      limit: 20,
    });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_due,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Invoices fetch error:", error);
    return NextResponse.json(
      { error: "Kon facturen niet ophalen" },
      { status: 500 }
    );
  }
}
