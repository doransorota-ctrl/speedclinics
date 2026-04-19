import { searchTreatmentInfo } from "./search";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

      case "book_appointment":
        return JSON.stringify({
          action: "book",
          patient_name: args.patient_name,
          start_time: args.start_time,
          end_time: args.end_time,
          treatment_type: args.treatment_type,
          status: "pending_confirmation",
        });

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

  const { data: business } = await supabase
    .from("businesses")
    .select("available_hours, slot_duration_minutes, max_appointments_per_day")
    .eq("id", businessId)
    .single();

  if (!business) {
    return JSON.stringify({ error: "Kan beschikbaarheid niet ophalen." });
  }

  // Map date to day of week
  const dateObj = new Date(date);
  const dayMap: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
  const dayKey = dayMap[dateObj.getDay()];
  const hours = business.available_hours as Record<string, { start: string; end: string } | null> | null;
  const dayHours = hours?.[dayKey];

  if (!dayHours) {
    const dayName = dateObj.toLocaleDateString("nl-NL", { weekday: "long" });
    return JSON.stringify({ available: false, message: `De kliniek is op ${dayName} gesloten.` });
  }

  // Generate slots based on business hours
  const duration = business.slot_duration_minutes || 30;
  const [startH, startM] = dayHours.start.split(":").map(Number);
  const [endH, endM] = dayHours.end.split(":").map(Number);
  const slots: string[] = [];

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes && slots.length < 8) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const endMin = currentMinutes + duration;
    const eh = Math.floor(endMin / 60);
    const em = endMin % 60;
    const slotEnd = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
    slots.push(`${slotStart} - ${slotEnd}`);
    currentMinutes += duration;
  }

  // Filter by time preference if given
  if (timePreference && slots.length > 0) {
    const pref = timePreference.toLowerCase();
    let filtered = slots;
    if (pref === "ochtend") filtered = slots.filter((s) => parseInt(s) < 12);
    else if (pref === "middag") filtered = slots.filter((s) => parseInt(s) >= 12 && parseInt(s) < 17);
    else if (pref === "avond") filtered = slots.filter((s) => parseInt(s) >= 17);
    if (filtered.length > 0) {
      const dayName = dateObj.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      return JSON.stringify({ available: true, date: dayName, slots: filtered.slice(0, 4) });
    }
  }

  const dayName = dateObj.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  return JSON.stringify({ available: true, date: dayName, slots: slots.slice(0, 4) });
}

/** Find existing appointment by phone number */
async function handleFindAppointment(businessId: string, phone: string, name?: string): Promise<string> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("leads")
    .select("id, customer_name, appointment_start, appointment_end, problem_summary, status")
    .eq("business_id", businessId)
    .eq("status", "appointment_set")
    .order("appointment_start", { ascending: true });

  if (phone) {
    query = query.eq("customer_phone", phone);
  }

  const { data: appointments } = await query.limit(5);

  if (!appointments || appointments.length === 0) {
    return JSON.stringify({ found: false, message: "Geen afspraken gevonden." });
  }

  return JSON.stringify({
    found: true,
    appointments: appointments.map((a) => ({
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
