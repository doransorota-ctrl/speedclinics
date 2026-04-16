import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  getPrimaryCalendarId,
} from "@/lib/calendar/google";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Google OAuth callback — exchanges code for tokens and stores them. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const rawState = searchParams.get("state") || "";
  const error = searchParams.get("error");

  // Parse origin from state (format: "randomHex|from")
  const pipeIdx = rawState.indexOf("|");
  const state = pipeIdx >= 0 ? rawState.slice(0, pipeIdx) : rawState;
  const from = pipeIdx >= 0 ? rawState.slice(pipeIdx + 1) : "settings";
  const redirectBase = from === "onboarding"
    ? "/portal/onboarding"
    : from === "setup"
      ? "/setup/agenda"
      : "/portal/settings";
  const calendarParam = from === "setup" ? "status" : "calendar";

  // Handle denial
  if (error || !code || !state) {
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?${calendarParam}=denied`
    );
  }

  const supabase = createServiceRoleClient();

  // Verify state token (stored with origin appended)
  const { data: stateRecord } = await supabase
    .from("google_oauth_states")
    .select("business_id, expires_at")
    .eq("state", rawState)
    .single();

  if (!stateRecord || new Date(stateRecord.expires_at) < new Date()) {
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?${calendarParam}=expired`
    );
  }

  // Delete used state
  await supabase.from("google_oauth_states").delete().eq("state", rawState);

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } =
      await exchangeCodeForTokens(code);

    // Get primary calendar ID
    const calendarId = await getPrimaryCalendarId(accessToken);

    // Store tokens
    await supabase.from("google_calendar_tokens").upsert({
      business_id: stateRecord.business_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expiry: new Date(
        Date.now() + expiresIn * 1000
      ).toISOString(),
      calendar_id: calendarId,
      connected_at: new Date().toISOString(),
      disconnected_at: null,
    });

    // Update business calendar type
    await supabase
      .from("businesses")
      .update({ calendar_type: "google" })
      .eq("id", stateRecord.business_id);

    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?${calendarParam}=connected`
    );
  } catch (err) {
    console.error("[Google OAuth] Token exchange failed:", err);
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?${calendarParam}=error`
    );
  }
}
