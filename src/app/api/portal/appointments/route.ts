import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  listCalendarEvents,
  refreshAccessToken,
} from "@/lib/calendar/google";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, available_hours")
    .eq("owner_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json(
      { error: "Bedrijf niet gevonden" },
      { status: 404 }
    );
  }

  // Parse weekStart (Monday) from query params, default to current week
  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");

  let weekStart: Date;
  if (weekStartParam) {
    const parsed = new Date(weekStartParam);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Ongeldige weekStart datum" },
        { status: 400 }
      );
    }
    weekStart = parsed;
    weekStart.setHours(0, 0, 0, 0);
  } else {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon
    const diff = day === 0 ? -6 : 1 - day;
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Fetch clŷniq appointments from database
  const { data: appointments, error: apptError } = await supabase
    .from("leads")
    .select(
      "id, customer_name, customer_phone, problem_summary, urgency, status, appointment_start, appointment_end, address, google_event_id"
    )
    .eq("business_id", business.id)
    .not("appointment_start", "is", null)
    .gte("appointment_start", weekStart.toISOString())
    .lt("appointment_start", weekEnd.toISOString())
    .order("appointment_start", { ascending: true });

  if (apptError) {
    return NextResponse.json(
      { error: "Kon afspraken niet ophalen" },
      { status: 500 }
    );
  }

  // Fetch Google Calendar events (if connected)
  let calendarEvents: {
    id: string;
    summary: string;
    location: string | null;
    start: string | null;
    end: string | null;
  }[] = [];

  try {
    const { data: calToken } = await supabase
      .from("google_calendar_tokens")
      .select("access_token, refresh_token, token_expiry, calendar_id")
      .eq("business_id", business.id)
      .single();

    if (calToken) {
      let accessToken = calToken.access_token;

      // Refresh token if expired
      if (new Date(calToken.token_expiry) < new Date()) {
        const refreshed = await refreshAccessToken(calToken.refresh_token);
        accessToken = refreshed.accessToken;
        await supabase
          .from("google_calendar_tokens")
          .update({
            access_token: accessToken,
            token_expiry: new Date(
              Date.now() + refreshed.expiresIn * 1000
            ).toISOString(),
          })
          .eq("business_id", business.id);
      }

      calendarEvents = await listCalendarEvents(
        accessToken,
        calToken.calendar_id || "primary",
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
    }
  } catch (err) {
    console.error("[Appointments] Failed to fetch calendar events:", err);
  }

  return NextResponse.json({
    appointments: appointments ?? [],
    calendarEvents,
    weekStart: weekStart.toISOString(),
    businessHours: business.available_hours,
  });
}
