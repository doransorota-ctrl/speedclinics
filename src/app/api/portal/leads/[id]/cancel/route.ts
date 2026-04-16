import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { deleteCalendarEvent, refreshAccessToken } from "@/lib/calendar/google";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Authenticate
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
  }

  const serviceClient = createServiceRoleClient();

  // Get the lead
  const { data: lead } = await serviceClient
    .from("leads")
    .select("id, business_id, status, appointment_start, appointment_end, google_event_id")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead niet gevonden" }, { status: 404 });
  }

  // Delete Google Calendar event if we have the event ID
  if (lead.google_event_id) {
    try {
      const { data: calToken } = await serviceClient
        .from("google_calendar_tokens")
        .select("access_token, refresh_token, token_expiry, calendar_id")
        .eq("business_id", business.id)
        .single();

      if (calToken) {
        let accessToken = calToken.access_token;
        if (new Date(calToken.token_expiry) < new Date()) {
          try {
            const refreshed = await refreshAccessToken(calToken.refresh_token);
            accessToken = refreshed.accessToken;
            await serviceClient
              .from("google_calendar_tokens")
              .update({
                access_token: accessToken,
                token_expiry: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
              })
              .eq("business_id", business.id);
          } catch (refreshErr) {
            console.error("[Cancel] Token refresh failed:", refreshErr);
            // Continue without calendar - will still cancel the lead
          }
        }

        await deleteCalendarEvent(
          accessToken,
          calToken.calendar_id || "primary",
          lead.google_event_id
        );
      }
    } catch (err) {
      console.error("[Cancel] Failed to delete calendar event:", err);
      // Continue anyway — still cancel the lead
    }
  }

  // Update lead: clear appointment, set status to lost
  await serviceClient
    .from("leads")
    .update({
      status: "lost",
      appointment_start: null,
      appointment_end: null,
      google_event_id: null,
      conversation_mode: "manual",
    })
    .eq("id", id)
    .eq("business_id", business.id);

  return NextResponse.json({ success: true });
}
