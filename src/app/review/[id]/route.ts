import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/** GET — Redirect to business's Google review link */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceRoleClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("google_review_link")
    .eq("id", params.id)
    .single();

  if (!business?.google_review_link) {
    // Fallback: Google Maps search for the business
    return NextResponse.redirect("https://www.google.com/maps");
  }

  return NextResponse.redirect(business.google_review_link);
}
