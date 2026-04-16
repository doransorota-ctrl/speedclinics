import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Validate step is a known value
    const VALID_STEPS = ["profile", "forwarding", "calendar", "hours", "appointments", "complete"];
    if (!VALID_STEPS.includes(step)) {
      return NextResponse.json({ error: "Ongeldige stap" }, { status: 400 });
    }

    // Enforce step ordering — fetch current step and validate transition
    const STEP_ORDER: Record<string, string> = {
      profile: "forwarding",
      forwarding: "calendar",
      calendar: "hours",
      hours: "appointments",
      appointments: "complete",
    };

    const { data: currentBiz } = await supabase
      .from("businesses")
      .select("onboarding_step, status")
      .eq("owner_id", user.id)
      .single();

    const currentStep = currentBiz?.onboarding_step ?? "profile";
    // Allow current step (re-save) or the next step in sequence
    if (step !== currentStep && STEP_ORDER[currentStep] !== step) {
      return NextResponse.json({ error: "Ongeldige stap" }, { status: 400 });
    }

    // Build the update object based on the step
    const update: Record<string, unknown> = {};

    if (step === "profile") {
      if (data.name) update.name = data.name;
      if (data.trade) update.trade = data.trade;
      if (data.service_area !== undefined) update.service_area = data.service_area;
      update.onboarding_step = "forwarding";
    }

    if (step === "forwarding") {
      update.forwarding_confirmed = data.confirmed ?? false;
      update.onboarding_step = "calendar";
    }

    if (step === "calendar") {
      // Calendar is connected via OAuth separately — just advance the step
      update.onboarding_step = "hours";
    }

    if (step === "hours") {
      if (data.available_hours) update.available_hours = data.available_hours;
      update.onboarding_step = "appointments";
    }

    if (step === "appointments") {
      if (data.slot_duration_minutes !== undefined) {
        const val = Number(data.slot_duration_minutes);
        if (isNaN(val) || val < 10 || val > 480) {
          return NextResponse.json({ error: "Ongeldige afspraakduur" }, { status: 400 });
        }
        update.slot_duration_minutes = val;
      }
      if (data.max_appointments_per_day !== undefined) {
        const val = Number(data.max_appointments_per_day);
        if (isNaN(val) || val < 1 || val > 50) {
          return NextResponse.json({ error: "Ongeldig maximaal aantal afspraken" }, { status: 400 });
        }
        update.max_appointments_per_day = val;
      }
      update.onboarding_step = "complete";
    }

    if (step === "complete") {
      update.onboarding_step = "complete";
      update.onboarding_completed_at = new Date().toISOString();
      if (currentBiz?.status === "active" || currentBiz?.status === "trialing") {
        update.speed_leads_active = true;
      }
      // Save optional Google review link if provided
      if (data.google_review_link && typeof data.google_review_link === "string") {
        const trimmed = data.google_review_link.trim();
        if (trimmed) {
          try {
            const parsed = new URL(trimmed);
            if (parsed.protocol !== "https:") {
              return NextResponse.json({ error: "Google Review link moet HTTPS zijn" }, { status: 400 });
            }
            update.google_review_link = parsed.toString();
          } catch {
            return NextResponse.json({ error: "Ongeldige Google Review link" }, { status: 400 });
          }
        }
      }
    }

    const { error: dbError } = await supabase
      .from("businesses")
      .update(update)
      .eq("owner_id", user.id);

    if (dbError) {
      console.error("Onboarding save error:", dbError);
      return NextResponse.json(
        { error: "Opslaan mislukt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
