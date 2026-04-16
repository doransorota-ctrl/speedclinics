import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDutchPhone } from "@/lib/phone";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, name, trade, service_area, phone, plan, status, calendar_type, onboarding_step, onboarding_completed_at, forwarding_confirmed, speed_leads_active, available_hours, slot_duration_minutes, max_appointments_per_day, google_review_link, twilio_number, whatsapp_profile_picture_handle, website_url")
      .eq("owner_id", user.id)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    return NextResponse.json({
      ...business,
      voiceNumber: process.env.TWILIO_VOICE_NUMBER || null,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = ["name", "trade", "service_area", "phone", "available_hours", "slot_duration_minutes", "max_appointments_per_day", "google_review_link", "speed_leads_active"];
    const update: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    // Validate google_review_link is a proper HTTPS URL
    if (update.google_review_link && typeof update.google_review_link === "string") {
      try {
        const parsed = new URL(update.google_review_link);
        if (parsed.protocol !== "https:") {
          return NextResponse.json({ error: "Google Review link moet een HTTPS URL zijn" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Ongeldige Google Review link" }, { status: 400 });
      }
    }

    // Validate available_hours structure
    if (update.available_hours !== undefined) {
      if (update.available_hours !== null && (typeof update.available_hours !== "object" || Array.isArray(update.available_hours))) {
        return NextResponse.json({ error: "Ongeldige beschikbaarheid" }, { status: 400 });
      }
    }

    // Validate numeric fields
    if (update.slot_duration_minutes !== undefined) {
      const val = Number(update.slot_duration_minutes);
      if (isNaN(val) || val < 10 || val > 480) {
        return NextResponse.json({ error: "Duur per afspraak moet tussen 10 en 480 minuten zijn" }, { status: 400 });
      }
      update.slot_duration_minutes = val;
    }
    if (update.max_appointments_per_day !== undefined) {
      const val = Number(update.max_appointments_per_day);
      if (isNaN(val) || val < 1 || val > 50) {
        return NextResponse.json({ error: "Max afspraken per dag moet tussen 1 en 50 zijn" }, { status: 400 });
      }
      update.max_appointments_per_day = val;
    }

    // Validate speed_leads_active is boolean
    if (update.speed_leads_active !== undefined) {
      update.speed_leads_active = !!update.speed_leads_active;
    }

    // Normalize phone to E.164 for consistent matching
    if (update.phone && typeof update.phone === "string") {
      update.phone = formatDutchPhone(update.phone);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Geen velden om bij te werken" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("businesses")
      .update(update)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Settings PATCH error:", error);
      return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
