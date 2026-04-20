/**
 * Smart slot matching — parses customer time preferences, checks Google Calendar
 * directly for availability, and builds pre-filtered context for the AI.
 *
 * Instead of generating a grid of slots and hoping the right one exists,
 * we ask Google Calendar: "is this exact time free?" and find nearby alternatives.
 */

import { getFreeBusy } from "./google";

// ─── Types ─────────────────────────────────────────────

export interface TimePreference {
  type: "exact" | "around" | "after" | "before" | "range";
  hour: number;
  minute: number;
  endHour?: number;
  endMinute?: number;
}

interface CheckResult {
  available: boolean;
  requestedLabel: string;        // "18:00"
  requestedStart: string;        // ISO datetime
  requestedEnd: string;          // ISO datetime
  alternatives: { label: string; start: string; end: string }[];
}

// ─── Time Parsing ──────────────────────────────────────

const DUTCH_NUMBERS: Record<string, number> = {
  een: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6,
  zeven: 7, acht: 8, negen: 9, tien: 10, elf: 11, twaalf: 12,
};

function normalizeHour(hour: number): number {
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

/** Dutch month names for stripping dates before time parsing. */
const DUTCH_MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
  "jan", "feb", "mrt", "apr", "jun", "jul", "aug", "sep", "sept", "okt", "nov", "dec",
];

/** Strip date references (e.g. "20 mei", "op 1 juni") so time parsing doesn't pick up day numbers as hours. */
function stripDateMentions(text: string): string {
  let result = text;
  for (const month of DUTCH_MONTHS) {
    // Match "20 mei", "op 20 mei", "20 mei 2025"
    const pattern = new RegExp(`\\b\\d{1,2}\\s+${month}\\b(?:\\s+\\d{4})?`, "gi");
    result = result.replace(pattern, "");
  }
  return result;
}

/** Score a time match to prefer real times (with prefix/minutes/"uur") over loose numbers. */
function scoreTimeMatch(prefix: string, hasMinutes: boolean, hasUur: boolean): number {
  let score = 0;
  if (prefix) score += 3;           // "om 15:00" strongly signals time
  if (hasMinutes) score += 3;        // "15:00" signals time
  if (hasUur) score += 2;            // "15 uur" signals time
  return score;
}

/** Parse a time preference from a Dutch customer message. */
export function parseTimePreference(message: string): TimePreference | null {
  const lower = message.toLowerCase().trim();

  // Ranges first (before exact times)
  if (lower.includes("ochtend") || lower.includes("'s ochtends") || lower.includes("s ochtends")) {
    return { type: "range", hour: 8, minute: 0, endHour: 12, endMinute: 0 };
  }
  if (lower.includes("einde middag") || lower.includes("eind van de middag") || lower.includes("eind middag")) {
    return { type: "around", hour: 17, minute: 0 };
  }
  if (lower.includes("middag") || lower.includes("'s middags") || lower.includes("s middags")) {
    return { type: "range", hour: 12, minute: 0, endHour: 17, endMinute: 0 };
  }
  if (lower.includes("avond") || lower.includes("'s avonds") || lower.includes("s avonds")) {
    return { type: "range", hour: 17, minute: 0, endHour: 20, endMinute: 0 };
  }
  if (/\bvroeg\b/.test(lower)) {
    return { type: "range", hour: 8, minute: 0, endHour: 10, endMinute: 0 };
  }
  if (/\blaat\b/.test(lower) || /\blater\b/.test(lower)) {
    return { type: "after", hour: 16, minute: 0 };
  }

  // "tussen X en Y"
  const tussenMatch = lower.match(/tussen\s+(\d{1,2})(?::(\d{2}))?\s+en\s+(\d{1,2})(?::(\d{2}))?/);
  if (tussenMatch) {
    return {
      type: "range",
      hour: normalizeHour(parseInt(tussenMatch[1])),
      minute: parseInt(tussenMatch[2] || "0"),
      endHour: normalizeHour(parseInt(tussenMatch[3])),
      endMinute: parseInt(tussenMatch[4] || "0"),
    };
  }

  // Strip date mentions ("20 mei") so we don't parse day numbers as hours
  const cleaned = stripDateMentions(lower);

  // Find ALL time-like matches and pick the highest-scoring one
  const timePattern = /(?:(rond|rondom|circa|na|vanaf|voor|om)\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(uur|u\b)?/g;
  type Candidate = { prefix: string; hour: number; minute: number; score: number };
  const candidates: Candidate[] = [];

  let match: RegExpExecArray | null;
  while ((match = timePattern.exec(cleaned)) !== null) {
    const prefix = match[1] || "";
    const hour = normalizeHour(parseInt(match[2]));
    const minute = parseInt(match[3] || "0");
    const hasMinutes = !!match[3];
    const hasUur = !!match[4];

    if (hour > 23 || minute > 59) continue;
    if (!prefix && !hasMinutes && !hasUur && hour <= 7) continue;

    const score = scoreTimeMatch(prefix, hasMinutes, hasUur);
    candidates.push({ prefix, hour, minute, score });
  }

  if (lower.includes("€") || lower.includes("euro")) {
    // Price context — skip time parsing
  } else if (candidates.length > 0) {
    // Pick highest score; on tie, the first one wins
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // If best candidate has zero score (no prefix, no minutes, no "uur") and is just a bare number,
    // it's probably not a reliable time mention — skip
    if (best.score === 0 && candidates.length === 1 && best.hour > 7) {
      // Ambiguous — could be anything. Return it anyway with low confidence.
    }

    if (best.prefix === "rond" || best.prefix === "rondom" || best.prefix === "circa") {
      return { type: "around", hour: best.hour, minute: best.minute };
    }
    if (best.prefix === "na" || best.prefix === "vanaf") {
      return { type: "after", hour: best.hour, minute: best.minute };
    }
    if (best.prefix === "voor") {
      return { type: "before", hour: best.hour, minute: best.minute };
    }
    return { type: "exact", hour: best.hour, minute: best.minute };
  }

  // Dutch number words
  for (const [word, num] of Object.entries(DUTCH_NUMBERS)) {
    const wordPattern = new RegExp(`(?:(rond|na|voor|om)\\s+)?${word}\\s*(?:uur|u\\b)`);
    const wordMatch = cleaned.match(wordPattern);
    if (wordMatch) {
      const prefix = wordMatch[1] || "";
      const hour = normalizeHour(num);
      const type = prefix === "rond" ? "around" : prefix === "na" ? "after" : prefix === "voor" ? "before" : "exact";
      return { type, hour, minute: 0 };
    }
  }

  // Vague urgency → treat as "first available"
  if (/snel|zsm|asap|direct|spoedig|zo snel/.test(lower)) {
    const nextHour = new Date().getHours() + 1;
    return { type: "after" as const, hour: nextHour > 20 ? 8 : nextHour, minute: 0 };
  }

  // "Maakt niet uit" / "wanneer het uitkomt" → first available morning
  if (/maakt niet uit|wanneer.*uitkomt|wat jij|mij maakt het niet uit|maakt me niet uit/.test(lower)) {
    return { type: "after" as const, hour: 8, minute: 0 };
  }

  return null;
}

// ─── Direct Calendar Check ─────────────────────────────

const pad = (n: number) => n.toString().padStart(2, "0");

function toLocalISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function formatDayLabel(date: Date): string {
  const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Vandaag";
  if (date.toDateString() === tomorrow.toDateString()) return "Morgen";
  return days[date.getDay()].charAt(0).toUpperCase() + days[date.getDay()].slice(1);
}

function makeSlotLabel(date: Date, slotDuration: number): string {
  const dayLabel = formatDayLabel(date);
  if (slotDuration <= 15) {
    return `${dayLabel} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const end = new Date(date.getTime() + slotDuration * 60000);
  return `${dayLabel} ${pad(date.getHours())}:${pad(date.getMinutes())}-${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

/** Check if a specific time window is free on Google Calendar. */
async function isTimeFree(
  accessToken: string,
  calendarId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const busy = await getFreeBusy(accessToken, calendarId, start.toISOString(), end.toISOString());
  return busy.length === 0;
}

/**
 * Check exact requested time against Google Calendar, find alternatives if busy.
 * This bypasses slot grid generation entirely — just asks "is 18:00 free?"
 */
export async function checkExactTime(
  accessToken: string,
  calendarId: string,
  targetDay: Date,
  pref: TimePreference,
  slotDuration: number,
  businessHours?: { start: string; end: string } | null,
): Promise<CheckResult> {
  const dayLabel = formatDayLabel(targetDay);
  const bhStart = businessHours ? parseInt(businessHours.start.split(":")[0]) : 8;
  const bhEnd = businessHours ? parseInt(businessHours.end.split(":")[0]) : 17;

  // For range/after/before: scan within the preference window
  if (pref.type === "range" || pref.type === "after" || pref.type === "before") {
    const scanFrom = pref.type === "before" ? Math.max(bhStart, 8) : pref.hour;
    const scanTo = pref.type === "before" ? pref.hour : (pref.endHour || bhEnd);

    // Get all busy blocks for the scan window
    const scanStart = new Date(targetDay);
    scanStart.setHours(scanFrom, 0, 0, 0);
    const scanEnd = new Date(targetDay);
    scanEnd.setHours(scanTo, 0, 0, 0);

    const busy = await getFreeBusy(accessToken, calendarId, scanStart.toISOString(), scanEnd.toISOString());
    const now = new Date();
    const minTime = new Date(now.getTime() + 60 * 60000);

    // Find free slots within the range by scanning every 30 min
    const found: { label: string; start: string; end: string }[] = [];
    const candidate = new Date(scanStart);
    while (candidate.getTime() + slotDuration * 60000 <= scanEnd.getTime() && found.length < 3) {
      if (candidate < minTime) {
        candidate.setTime(candidate.getTime() + 30 * 60000);
        continue;
      }
      const cEnd = new Date(candidate.getTime() + slotDuration * 60000);
      const conflict = busy.some((b: { start: string; end: string }) =>
        new Date(b.start) < cEnd && new Date(b.end) > candidate
      );
      if (!conflict) {
        found.push({
          label: makeSlotLabel(candidate, slotDuration),
          start: toLocalISO(candidate),
          end: toLocalISO(cEnd),
        });
      }
      candidate.setTime(candidate.getTime() + 30 * 60000);
    }

    const rangeLabel = pref.type === "range"
      ? `${pad(pref.hour)}:${pad(pref.minute)}-${pad(pref.endHour || bhEnd)}:00`
      : pref.type === "after"
        ? `na ${pad(pref.hour)}:${pad(pref.minute)}`
        : `voor ${pad(pref.hour)}:${pad(pref.minute)}`;

    if (found.length > 0) {
      return {
        available: true,
        requestedLabel: rangeLabel,
        requestedStart: found[0].start,
        requestedEnd: found[0].end,
        alternatives: found,
      };
    }
    return {
      available: false,
      requestedLabel: rangeLabel,
      requestedStart: "",
      requestedEnd: "",
      alternatives: [],
    };
  }

  // For exact/around: check the specific time, then find nearby alternatives
  const requested = new Date(targetDay);
  requested.setHours(pref.hour, pref.minute, 0, 0);
  const requestedEnd = new Date(requested.getTime() + slotDuration * 60000);
  const requestedLabel = `${pad(pref.hour)}:${pad(pref.minute)}`;

  // Check if within business hours
  if (pref.hour < bhStart || pref.hour >= bhEnd) {
    // Outside business hours — find alternatives within hours
    const alts = await findNearbyFreeSlots(accessToken, calendarId, targetDay, pref.hour, slotDuration, bhStart, bhEnd);
    return { available: false, requestedLabel, requestedStart: "", requestedEnd: "", alternatives: alts };
  }

  // Check exact time
  const free = await isTimeFree(accessToken, calendarId, requested, requestedEnd);

  if (free) {
    // Also grab 1-2 alternatives in case they want to adjust
    return {
      available: true,
      requestedLabel,
      requestedStart: toLocalISO(requested),
      requestedEnd: toLocalISO(requestedEnd),
      alternatives: [{ label: makeSlotLabel(requested, slotDuration), start: toLocalISO(requested), end: toLocalISO(requestedEnd) }],
    };
  }

  // Busy — find the 2 closest free times (scan ±2 hours)
  const alts = await findNearbyFreeSlots(accessToken, calendarId, targetDay, pref.hour, slotDuration, bhStart, bhEnd);
  return { available: false, requestedLabel, requestedStart: "", requestedEnd: "", alternatives: alts };
}

/** Scan nearby hours around a target time to find 2-3 free slots. */
async function findNearbyFreeSlots(
  accessToken: string,
  calendarId: string,
  targetDay: Date,
  targetHour: number,
  slotDuration: number,
  bhStart: number,
  bhEnd: number,
): Promise<{ label: string; start: string; end: string }[]> {
  // Wider scan for longer appointments (±3h for 2-hour jobs, ±2h for short demos)
  const scanRadius = Math.max(2, Math.ceil(slotDuration / 60) + 1);
  const scanFrom = Math.max(bhStart, targetHour - scanRadius);
  const scanTo = Math.min(bhEnd, targetHour + scanRadius);

  const scanStart = new Date(targetDay);
  scanStart.setHours(scanFrom, 0, 0, 0);
  const scanEnd = new Date(targetDay);
  scanEnd.setHours(scanTo, 0, 0, 0);

  const busy = await getFreeBusy(accessToken, calendarId, scanStart.toISOString(), scanEnd.toISOString());
  const now = new Date();
  const minTime = new Date(now.getTime() + 60 * 60000);

  const found: { label: string; start: string; end: string }[] = [];
  const candidate = new Date(scanStart);

  while (candidate.getTime() + slotDuration * 60000 <= scanEnd.getTime() && found.length < 3) {
    if (candidate < minTime) {
      candidate.setTime(candidate.getTime() + 30 * 60000);
      continue;
    }
    const cEnd = new Date(candidate.getTime() + slotDuration * 60000);
    const conflict = busy.some((b: { start: string; end: string }) =>
      new Date(b.start) < cEnd && new Date(b.end) > candidate
    );
    if (!conflict) {
      found.push({
        label: makeSlotLabel(candidate, slotDuration),
        start: toLocalISO(candidate),
        end: toLocalISO(cEnd),
      });
    }
    candidate.setTime(candidate.getTime() + 30 * 60000);
  }

  return found;
}

// ─── Context Builder ───────────────────────────────────

/** Build pre-formatted slot context for the AI prompt from a direct calendar check. */
export function buildCheckContext(result: CheckResult): string {
  if (result.available && result.alternatives.length > 0) {
    return `TIJDSLOT GEVONDEN: ${result.alternatives[0].label} is beschikbaar. Bevestig dit tijdslot met de klant.`;
  }

  if (!result.available && result.alternatives.length > 0) {
    const optionLines = result.alternatives.map((s) => `- ${s.label}`).join("\n");
    return `GEVRAAGDE TIJD: ${result.requestedLabel} is niet beschikbaar.\nDICHTSTBIJZIJNDE OPTIES:\n${optionLines}\nBied deze aan als alternatief.`;
  }

  return `GEEN BESCHIKBAARHEID rond ${result.requestedLabel}. Vraag de klant om een andere dag.`;
}
