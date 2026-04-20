import { searchTreatmentInfo } from "./search";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSlotsForDay } from "@/lib/calendar/availability";
import { refreshAccessToken } from "@/lib/calendar/google";
import { formatDutchPhone } from "@/lib/phone";

/** Execute a tool call and return the result as a string for the AI */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  businessId: string,
  customerPhone?: string,
): Promise<string> {
  try {
    switch (toolName) {
      case "lookup_treatment_info":
        return await handleLookup(businessId, args.query as string);

      case "check_availability":
        return await handleCheckAvailability(businessId, args.preferred_date as string, args.preferred_time as string | undefined);

      case "book_appointment": {
        const start = String(args.start_time || "");
        const end = String(args.end_time || "");
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return JSON.stringify({ error: "Ongeldige datum/tijd." });
        }
        if (endDate <= startDate) {
          return JSON.stringify({ error: "Eindtijd moet na de starttijd zijn." });
        }
        if (startDate.getTime() < Date.now() - 5 * 60 * 1000) {
          return JSON.stringify({ error: "De afspraak kan niet in het verleden liggen." });
        }

        return JSON.stringify({
          action: "book",
          patient_name: args.patient_name,
          start_time: start,
          end_time: end,
          treatment_type: args.treatment_type,
          status: "pending_confirmation",
        });
      }

      case "find_appointment":
        return await handleFindAppointment(businessId, args.patient_phone as string, args.patient_name as string | undefined);

      case "cancel_appointment":
        return await handleCancelAppointment(args.appointment_id as string, args.reason as string | undefined);

      default:
        return JSON.stringify({ error: `Onbekende tool: ${toolName}` });
    }
  } catch (err) {
    console.error(`[Tool] Error executing ${toolName}:`, err);
    return JSON.stringify({ error: `Fout bij ${toolName}: ${err instanceof Error ? err.message : "onbekende fout"}` });
  }
}

/** Lookup treatment info from vector database */
async function handleLookup(businessId: string, query: string): Promise<string> {
  const result = await searchTreatmentInfo(businessId, query);
  if (!result) {
    return JSON.stringify({ result: "Geen informatie gevonden over dit onderwerp op de website van de kliniek." });
  }
  return result;
}

/** Check calendar availability for a date */
async function handleCheckAvailability(businessId: string, date: string, timePreference?: string): Promise<string> {
  const supabase = createServiceRoleClient();

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return JSON.stringify({ error: "Ongeldig datumformaat. Gebruik YYYY-MM-DD." });
  }

  const dateObj = new Date(date + "T00:00:00");
  if (isNaN(dateObj.getTime())) {
    return JSON.stringify({ error: "Ongeldige datum." });
  }

  // Reject dates in the past (only compare dates, not times)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    return JSON.stringify({ error: "Die datum ligt in het verleden." });
  }

  // Reject dates more than 6 months out
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  if (dateObj > maxDate) {
    return JSON.stringify({ error: "Ik kan alleen afspraken inplannen tot 6 maanden vooruit." });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("available_hours, slot_duration_minutes, max_appointments_per_day")
    .eq("id", businessId)
    .single();

  if (!business) {
    return JSON.stringify({ error: "Kan beschikbaarheid niet ophalen." });
  }

  const dayMap: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
  const dayKey = dayMap[dateObj.getDay()];
  const hours = business.available_hours as Record<string, { start: string; end: string } | null> | null;
  const dayHours = hours?.[dayKey];
  const dayName = dateObj.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  if (!dayHours) {
    return JSON.stringify({ available: false, message: `De kliniek is op ${dayName} gesloten.` });
  }

  const duration = business.slot_duration_minutes || 30;

  // Try to use Google Calendar for accurate availability
  const { data: calToken } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, token_expiry, calendar_id")
    .eq("business_id", businessId)
    .single();

  type SlotInfo = { label: string; startMin: number };
  let slots: SlotInfo[] = [];

  if (calToken) {
    // Use Google Calendar for real availability
    try {
      let accessToken = calToken.access_token;
      if (new Date(calToken.token_expiry) < new Date()) {
        const refreshed = await refreshAccessToken(calToken.refresh_token);
        accessToken = refreshed.accessToken;
        await supabase
          .from("google_calendar_tokens")
          .update({
            access_token: accessToken,
            token_expiry: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
          })
          .eq("business_id", businessId);
      }

      const calSlots = await getSlotsForDay(accessToken, calToken.calendar_id || "primary", dateObj, {
        slotDuration: duration,
        maxPerDay: business.max_appointments_per_day || 20,
        bufferMinutes: 0,
        businessHours: hours ?? undefined,
      });

      slots = calSlots.map((s) => {
        const d = new Date(s.start);
        const e = new Date(s.end);
        const label = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} - ${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
        return { label, startMin: d.getHours() * 60 + d.getMinutes() };
      });
    } catch (err) {
      console.warn("[Tool] Calendar fetch failed, falling back to business hours:", err);
    }
  }

  // Fallback: generate slots from business hours only (if no calendar or calendar failed)
  if (slots.length === 0) {
    const [startH, startM] = dayHours.start.split(":").map(Number);
    const [endH, endM] = dayHours.end.split(":").map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const endMin = currentMinutes + duration;
      const eh = Math.floor(endMin / 60);
      const em = endMin % 60;
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} - ${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
      slots.push({ label, startMin: currentMinutes });
      currentMinutes += duration;
    }
  }

  if (slots.length === 0) {
    return JSON.stringify({ available: false, date: dayName, message: `De kliniek is op ${dayName} vol.` });
  }

  // Filter by time preference
  if (timePreference) {
    const pref = timePreference.toLowerCase().trim();

    // Specific time (e.g. "15:00", "14:30")
    const timeMatch = pref.match(/^(\d{1,2})[:\.]?(\d{2})?$/);
    if (timeMatch) {
      const requestedH = parseInt(timeMatch[1]);
      const requestedM = parseInt(timeMatch[2] || "0");
      const requestedMinutes = requestedH * 60 + requestedM;

      // Within 1.5 hours of requested time, sorted by proximity
      const nearby = slots
        .filter((s) => Math.abs(s.startMin - requestedMinutes) <= 90)
        .sort((a, b) => Math.abs(a.startMin - requestedMinutes) - Math.abs(b.startMin - requestedMinutes));

      if (nearby.length > 0) {
        return JSON.stringify({ available: true, date: dayName, slots: nearby.slice(0, 4).map((s) => s.label) });
      }

      // Show alternatives closest to the requested time
      const closest = slots
        .slice()
        .sort((a, b) => Math.abs(a.startMin - requestedMinutes) - Math.abs(b.startMin - requestedMinutes))
        .slice(0, 4)
        .map((s) => s.label);

      return JSON.stringify({
        available: false,
        date: dayName,
        message: `Er is helaas geen beschikbaarheid rond ${pref}. Dichtstbijzijnde beschikbare tijden: ${closest.join(", ")}.`,
      });
    }

    // Period (ochtend/middag/avond)
    let filtered: SlotInfo[] = slots;
    if (pref.includes("ochtend")) {
      filtered = slots.filter((s) => s.startMin < 12 * 60);
    } else if (pref.includes("middag")) {
      filtered = slots.filter((s) => s.startMin >= 12 * 60 && s.startMin < 17 * 60);
    } else if (pref.includes("avond") || pref.includes("laat")) {
      filtered = slots.filter((s) => s.startMin >= 17 * 60);
    }

    if (filtered.length > 0) {
      return JSON.stringify({ available: true, date: dayName, slots: filtered.slice(0, 4).map((s) => s.label) });
    }
    return JSON.stringify({
      available: false,
      date: dayName,
      message: `Er is helaas geen beschikbaarheid in de ${pref}. Wel beschikbaar: ${slots.slice(0, 4).map((s) => s.label).join(", ")}.`,
    });
  }

  return JSON.stringify({ available: true, date: dayName, slots: slots.slice(0, 4).map((s) => s.label) });
}

/** Find existing appointment by phone number */
async function handleFindAppointment(businessId: string, phone: string, name?: string): Promise<string> {
  const supabase = createServiceRoleClient();

  // Normalize phone to E.164 so we can match stored numbers regardless of format
  const normalizedPhone = phone ? formatDutchPhone(phone) : "";

  let query = supabase
    .from("leads")
    .select("id, customer_name, appointment_start, appointment_end, problem_summary, status")
    .eq("business_id", businessId)
    .eq("status", "appointment_set")
    .gt("appointment_start", new Date().toISOString()) // only future appointments
    .order("appointment_start", { ascending: true });

  if (normalizedPhone) {
    query = query.eq("customer_phone", normalizedPhone);
  }

  const { data: appointments } = await query.limit(5);

  // If name provided and multiple matches, filter by name (fuzzy)
  let filtered = appointments ?? [];
  if (name && filtered.length > 1) {
    const nameLower = name.toLowerCase().trim();
    const exactMatches = filtered.filter(
      (a) => a.customer_name?.toLowerCase().includes(nameLower)
    );
    if (exactMatches.length > 0) filtered = exactMatches;
  }

  if (filtered.length === 0) {
    return JSON.stringify({ found: false, message: "Geen toekomstige afspraken gevonden op dit nummer." });
  }

  return JSON.stringify({
    found: true,
    count: filtered.length,
    appointments: filtered.map((a) => ({
      id: a.id,
      name: a.customer_name,
      start: a.appointment_start,
      end: a.appointment_end,
      treatment: a.problem_summary,
    })),
  });
}

/** Cancel an appointment */
async function handleCancelAppointment(appointmentId: string, reason?: string): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "lost",
      problem_details: reason ? `Geannuleerd: ${reason}` : "Geannuleerd door patiënt",
    })
    .eq("id", appointmentId)
    .eq("status", "appointment_set")
    .select("id, customer_name")
    .single();

  if (error || !data) {
    return JSON.stringify({ cancelled: false, error: "Kon afspraak niet annuleren. Mogelijk is deze al geannuleerd." });
  }

  // TODO: Also cancel Google Calendar event if exists

  return JSON.stringify({ cancelled: true, message: `Afspraak van ${data.customer_name} is geannuleerd.` });
}
