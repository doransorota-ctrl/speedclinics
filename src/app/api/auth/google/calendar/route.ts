import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/calendar/google";
import { randomBytes } from "crypto";

/** Initiate Google Calendar OAuth — redirects to Google consent screen. */
export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get business for this user
  const admin = createServiceRoleClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  // Read origin (onboarding vs settings) for post-OAuth redirect
  const { searchParams } = new URL(request.url);
  const rawFrom = searchParams.get("from") || "";
  const from = ["settings", "onboarding"].includes(rawFrom) ? rawFrom : "settings";

  // Generate state token with origin encoded
  const state = randomBytes(32).toString("hex");
  const stateWithOrigin = `${state}|${from}`;

  // Store state in DB (expires in 10 minutes)
  await admin.from("google_oauth_states").insert({
    state: stateWithOrigin,
    business_id: business.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  // Redirect to Google
  const url = getGoogleAuthUrl(stateWithOrigin);
  return NextResponse.redirect(url);
}
