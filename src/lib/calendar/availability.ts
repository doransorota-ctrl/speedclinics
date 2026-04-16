import { getFreeBusy } from "./google";

interface TimeSlot {
  start: string;
  end: string;
  label: string; // Human-readable Dutch label for the customer
}

/** Business hours per day — matches the WeekHours type from BusinessHours component. */
type DayHours = { start: string; end: string } | null;
export type BusinessHoursConfig = {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
};

/** Map day keys to JS getDay() values. */
const NUM_TO_DAY: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

const DEFAULT_HOURS: BusinessHoursConfig = {
  mon: { start: "08:00", end: "17:00" },
  tue: { start: "08:00", end: "17:00" },
  wed: { start: "08:00", end: "17:00" },
  thu: { start: "08:00", end: "17:00" },
  fri: { start: "08:00", end: "17:00" },
  sat: null,
  sun: null,
};

/**
 * Get available appointment slots for a business.
 *
 * Pass `limit` to cap total slots returned (default 6 — enough for initial offer).
 * Use `getSlotsForDay()` when the customer requests a specific day.
 */
export async function getAvailableSlots(
  accessToken: string,
  calendarId: string,
  options: {
    daysAhead?: number;
    slotDuration?: number; // minutes per appointment
    maxPerDay?: number;
    bufferMinutes?: number; // travel/buffer time between appointments
    businessHours?: BusinessHoursConfig | null;
    limit?: number; // max total slots to return
  } = {}
): Promise<TimeSlot[]> {
  const {
    daysAhead = 14,
    slotDuration = 120,
    maxPerDay = 6,
    bufferMinutes = 30,
    businessHours,
    limit = 6,
  } = options;

  const blockDuration = slotDuration + bufferMinutes;
  const hours = businessHours || DEFAULT_HOURS;

  const now = new Date();
  const minTime = new Date(now.getTime() + 60 * 60000); // 1 hour from now
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);

  const busySlots = await getFreeBusy(
    accessToken,
    calendarId,
    now.toISOString(),
    endDate.toISOString()
  );

  const slots: TimeSlot[] = [];
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  // If it's past business hours today, start from tomorrow
  if (now.getHours() >= 17) {
    current.setDate(current.getDate() + 1);
  }

  while (current < endDate) {
    const dayOfWeek = current.getDay();
    const dayKey = NUM_TO_DAY[dayOfWeek] as keyof BusinessHoursConfig;
    const dayHours = hours[dayKey];

    if (!dayHours) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Count existing events on this day
    const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0);
    const dayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59);
    const eventsToday = busySlots.filter(
      (b: { start: string; end: string }) => new Date(b.start) >= dayStart && new Date(b.start) < dayEnd
    ).length;

    if (eventsToday >= maxPerDay) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    const startHour = parseHour(dayHours.start);
    const endHour = parseHour(dayHours.end);
    const dayLabel = formatDayLabel(current);

    // Find ALL open slots for this day
    const daySlotsAll: TimeSlot[] = [];
    const scanStart = new Date(current);
    scanStart.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
    const scanEnd = new Date(current);
    scanEnd.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);

    let slotsFoundToday = eventsToday;
    const candidate = new Date(scanStart);

    while (
      candidate.getTime() + slotDuration * 60000 <= scanEnd.getTime() &&
      slotsFoundToday < maxPerDay
    ) {
      if (candidate < minTime) {
        candidate.setTime(candidate.getTime() + 30 * 60000);
        continue;
      }

      const candidateEnd = new Date(candidate.getTime() + slotDuration * 60000);
      const candidateBlock = new Date(candidate.getTime() + blockDuration * 60000);

      const conflicts = busySlots.some(
        (busy: { start: string; end: string }) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return busyStart < candidateBlock && busyEnd > candidate;
        }
      );

      if (!conflicts) {
        const startH = candidate.getHours();
        const startM = candidate.getMinutes();
        const endH = candidateEnd.getHours();
        const endM = candidateEnd.getMinutes();
        const timeLabel = slotDuration <= 15
          ? `${pad(startH)}:${pad(startM)}`
          : `${pad(startH)}:${pad(startM)}-${pad(endH)}:${pad(endM)}`;

        daySlotsAll.push({
          start: toLocalISO(candidate),
          end: toLocalISO(candidateEnd),
          label: `${dayLabel} ${timeLabel}`,
        });
        slotsFoundToday++;

        candidate.setTime(candidate.getTime() + blockDuration * 60000);
        continue;
      }

      candidate.setTime(candidate.getTime() + Math.min(blockDuration, 30) * 60000);
    }

    for (const slot of daySlotsAll) {
      slots.push(slot);
      if (slots.length >= limit) break;
    }

    if (slots.length >= limit) break;
    current.setDate(current.getDate() + 1);
  }

  return slots;
}

/**
 * Get ALL available slots for a specific day.
 * Used when the customer requests a different day than what was initially offered.
 */
export async function getSlotsForDay(
  accessToken: string,
  calendarId: string,
  targetDate: Date,
  options: {
    slotDuration?: number;
    maxPerDay?: number;
    bufferMinutes?: number;
    businessHours?: BusinessHoursConfig | null;
  } = {}
): Promise<TimeSlot[]> {
  const {
    slotDuration = 120,
    maxPerDay = 6,
    bufferMinutes = 30,
    businessHours,
  } = options;

  const blockDuration = slotDuration + bufferMinutes;
  const hours = businessHours || DEFAULT_HOURS;

  const dayOfWeek = targetDate.getDay();
  const dayKey = NUM_TO_DAY[dayOfWeek] as keyof BusinessHoursConfig;
  const dayHours = hours[dayKey];

  if (!dayHours) return []; // closed on this day

  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0);
  const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

  const busySlots = await getFreeBusy(accessToken, calendarId, dayStart.toISOString(), dayEnd.toISOString());

  const eventsToday = busySlots.filter(
    (b: { start: string; end: string }) => new Date(b.start) >= dayStart && new Date(b.start) < dayEnd
  ).length;

  // For day-specific lookup, only skip if calendar is completely packed
  if (eventsToday >= 50) return [];

  const startHour = parseHour(dayHours.start);
  const endHour = parseHour(dayHours.end);
  const dayLabel = formatDayLabel(targetDate);
  const now = new Date();
  const minTime = new Date(now.getTime() + 60 * 60000); // 1 hour from now

  const slots: TimeSlot[] = [];
  const scanStart = new Date(targetDate);
  scanStart.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
  const scanEnd = new Date(targetDate);
  scanEnd.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);

  const candidate = new Date(scanStart);

  while (
    candidate.getTime() + slotDuration * 60000 <= scanEnd.getTime()
  ) {
    if (candidate < minTime) {
      candidate.setTime(candidate.getTime() + 30 * 60000);
      continue;
    }

    const candidateEnd = new Date(candidate.getTime() + slotDuration * 60000);
    const candidateBlock = new Date(candidate.getTime() + blockDuration * 60000);

    const conflicts = busySlots.some(
      (busy: { start: string; end: string }) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return busyStart < candidateBlock && busyEnd > candidate;
      }
    );

    if (!conflicts) {
      const startH = candidate.getHours();
      const startM = candidate.getMinutes();
      const endH = candidateEnd.getHours();
      const endM = candidateEnd.getMinutes();
      const timeLabel = slotDuration <= 15
        ? `${pad(startH)}:${pad(startM)}`
        : `${pad(startH)}:${pad(startM)}-${pad(endH)}:${pad(endM)}`;

      slots.push({
        start: toLocalISO(candidate),
        end: toLocalISO(candidateEnd),
        label: `${dayLabel} ${timeLabel}`,
      });
      candidate.setTime(candidate.getTime() + blockDuration * 60000);
      continue;
    }

    candidate.setTime(candidate.getTime() + 30 * 60000);
  }

  return slots;
}

/** Parse "08:00" or "13:30" to a decimal hour (8 or 13.5). */
function parseHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + (m || 0) / 60;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format a Date as local ISO string without Z suffix (for Google Calendar with timeZone). */
function toLocalISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
