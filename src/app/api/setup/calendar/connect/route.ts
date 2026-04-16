import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySetupToken } from "@/lib/setup-token";
import { getGoogleAuthUrl } from "@/lib/calendar/google";
import { randomBytes } from "crypto";

/** GET — Passwordless Google Calendar OAuth initiation via setup token */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://clyniq.nl";

  if (!token) {
    return NextResponse.redirect(`${origin}/setup/agenda?status=error`);
  }

  const result = verifySetupToken(token);
  if (!result) {
    return NextResponse.redirect(`${origin}/setup/agenda?status=expired`);
  }

  const supabase = createServiceRoleClient();

  // Find business by Twilio number
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("twilio_number", result.number)
    .single();

  if (!business) {
    return NextResponse.redirect(`${origin}/setup/agenda?status=error`);
  }

  // Generate OAuth state with "setup" origin
  const state = randomBytes(32).toString("hex");
  const stateWithOrigin = `${state}|setup`;

  // Store state in google_oauth_states table
  await supabase.from("google_oauth_states").insert({
    state: stateWithOrigin,
    business_id: business.id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  // Redirect to Google consent
  const googleUrl = getGoogleAuthUrl(stateWithOrigin);
  return NextResponse.redirect(googleUrl);
}
