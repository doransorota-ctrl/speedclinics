import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // Find business
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (business) {
      const admin = createServiceRoleClient();

      // Retrieve token for revocation
      const { data: tokenRow } = await admin
        .from("google_calendar_tokens")
        .select("refresh_token")
        .eq("business_id", business.id)
        .maybeSingle();

      if (tokenRow?.refresh_token) {
        // Revoke the token with Google (best-effort)
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${tokenRow.refresh_token}`,
          { method: "POST" }
        ).catch(() => {});
      }

      // Delete the token row
      await admin
        .from("google_calendar_tokens")
        .delete()
        .eq("business_id", business.id);
    }

    // Clear calendar type
    const { error } = await supabase
      .from("businesses")
      .update({ calendar_type: null })
      .eq("owner_id", user.id);

    if (error) {
      console.error("Calendar disconnect error:", error);
      return NextResponse.json({ error: "Ontkoppelen mislukt" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
