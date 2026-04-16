"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────── */

interface Appointment {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  problem_summary: string | null;
  urgency: "low" | "medium" | "high" | "emergency" | null;
  status: string;
  appointment_start: string;
  appointment_end: string;
  address: string | null;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string | null;
  start: string;
  end: string;
}

// Unified type for rendering both in the grid/list
interface AgendaItem {
  id: string;
  title: string;
  start: string;
  end: string;
  address: string | null;
  urgency: string | null;
  problem: string | null;
  source: "lead" | "google";
}

type DayHours = { start: string; end: string } | null;
type BusinessHours = Record<string, DayHours>;

/* ─── Constants ──────────────────────────────────────────── */

const DAYS_SHORT = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const urgencyLabels: Record<string, string> = {
  low: "Laag",
  medium: "Gemiddeld",
  high: "Hoog",
  emergency: "Spoed",
};
const urgencyColors: Record<string, string> = {
  low: "bg-surface-100 text-surface-600",
  medium: "bg-yellow-50 text-yellow-700",
  high: "bg-orange-50 text-orange-700",
  emergency: "bg-red-50 text-red-700",
};

/* ─── Helpers ────────────────────────────────────────────── */

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const sDay = monday.getDate();
  const eDay = sunday.getDate();
  if (monday.getMonth() === sunday.getMonth()) {
    const month = monday.toLocaleDateString("nl-NL", { month: "long" });
    return `${sDay} – ${eDay} ${month} ${monday.getFullYear()}`;
  }
  const sMonth = monday.toLocaleDateString("nl-NL", { month: "short" });
  const eMonth = sunday.toLocaleDateString("nl-NL", { month: "short" });
  return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${sunday.getFullYear()}`;
}

/* ─── Page ───────────────────────────────────────────────── */

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch appointments when week changes
  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/portal/appointments?weekStart=${weekStart.toISOString()}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setAppointments(data.appointments);
          setCalendarEvents(data.calendarEvents ?? []);
          setBusinessHours(data.businessHours);
        }
      } catch {
        if (!cancelled) setError("Kon afspraken niet laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch_();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  // Week navigation
  const goToPrev = () =>
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  const goToNext = () =>
    setWeekStart((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  const goToThisWeek = () => setWeekStart(getMonday(new Date()));

  // Grid hours based on business hours
  const gridHours = useMemo(() => {
    if (!businessHours) return { start: 8, end: 17 };
    let earliest = 24;
    let latest = 0;
    for (const key of DAY_KEYS) {
      const dh = businessHours[key];
      if (dh) {
        const s = parseInt(dh.start.split(":")[0]);
        const e = parseInt(dh.end.split(":")[0]);
        if (s < earliest) earliest = s;
        if (e > latest) latest = e;
      }
    }
    return {
      start: earliest === 24 ? 8 : earliest,
      end: latest === 0 ? 17 : latest,
    };
  }, [businessHours]);

  // Merge leads + Google Calendar into unified agenda items
  const allItems = useMemo(() => {
    const leadIds = new Set(appointments.map((a) => a.id));
    const items: AgendaItem[] = appointments.map((a) => ({
      id: a.id,
      title: a.customer_name || a.customer_phone,
      start: a.appointment_start,
      end: a.appointment_end,
      address: a.address,
      urgency: a.urgency,
      problem: a.problem_summary,
      source: "lead" as const,
    }));

    // Add Google Calendar events — skip Clŷniq events (they're already in appointments)
    const leadGoogleIds = new Set(
      appointments
        .map((a) => (a as Appointment & { google_event_id?: string }).google_event_id)
        .filter(Boolean)
    );

    for (const ev of calendarEvents) {
      if (!ev.start || !ev.end) continue;
      // Skip events created by Clŷniq (matched by google_event_id or description)
      if (leadGoogleIds.has(ev.id)) continue;
      if (ev.description?.includes("Aangemaakt door Clŷniq")) continue;

      items.push({
        id: `gcal_${ev.id}`,
        title: ev.summary,
        start: ev.start,
        end: ev.end,
        address: ev.location,
        urgency: null,
        problem: null,
        source: "google",
      });
    }

    items.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    return items;
  }, [appointments, calendarEvents]);

  // Group items by day index (0=Mon .. 6=Sun)
  const itemsByDay = useMemo(() => {
    const grouped: Record<number, AgendaItem[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    for (const item of allItems) {
      const itemDate = new Date(item.start);
      const dayIdx = Math.floor(
        (itemDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayIdx >= 0 && dayIdx < 7) {
        grouped[dayIdx].push(item);
      }
    }
    return grouped;
  }, [allItems, weekStart]);

  const today = new Date();
  const totalHours = gridHours.end - gridHours.start;
  const hours = Array.from(
    { length: totalHours + 1 },
    (_, i) => gridHours.start + i
  );

  /* ─── Loading ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-32" />
        <div className="h-5 bg-surface-100 rounded w-64" />
        <div className="bg-white rounded-xl border border-surface-200 h-[400px]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-surface-200 h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ─── Render ───────────────────────────────────────────── */
  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">Agenda</h1>
      <p className="text-surface-500 mt-1">
        Alle geplande afspraken op een rij.
      </p>

      {/* Week navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={goToPrev}
          className="flex items-center gap-1 text-sm text-surface-600 hover:text-surface-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Vorige week
        </button>

        <button
          onClick={goToThisWeek}
          className="text-sm font-semibold text-surface-900 hover:text-brand-700 transition-colors"
        >
          {formatWeekRange(weekStart)}
        </button>

        <button
          onClick={goToNext}
          className="flex items-center gap-1 text-sm text-surface-600 hover:text-surface-900 transition-colors"
        >
          Volgende week
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* ─── Calendar grid (desktop) ─────────────────────── */}
      <div className="mt-6 hidden md:block bg-white rounded-xl border border-surface-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
          <div className="p-2" />
          {DAYS_SHORT.map((day, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div
                key={day}
                className={`p-2 text-center border-l border-surface-100 ${
                  isToday ? "bg-brand-50" : ""
                }`}
              >
                <p className="text-xs text-surface-500 uppercase">{day}</p>
                <p
                  className={`text-sm font-semibold ${
                    isToday ? "text-brand-700" : "text-surface-900"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[500px] overflow-y-auto"
          style={{ gridTemplateRows: `repeat(${hours.length}, 48px)` }}
        >
          {/* Time labels */}
          {hours.map((h, rowIdx) => (
            <div
              key={`t-${h}`}
              className="text-xs text-surface-400 pr-2 text-right pt-1 border-t border-surface-100"
              style={{ gridRow: rowIdx + 1, gridColumn: 1 }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}

          {/* Day columns */}
          {DAYS_SHORT.map((_, dayIdx) => {
            const colDate = new Date(weekStart);
            colDate.setDate(colDate.getDate() + dayIdx);
            const isToday = colDate.toDateString() === today.toDateString();
            return (
              <div
                key={`col-${dayIdx}`}
                className={`relative border-l border-surface-100 ${
                  isToday ? "bg-brand-50/30" : ""
                }`}
                style={{
                  gridColumn: dayIdx + 2,
                  gridRow: `1 / ${hours.length + 1}`,
                }}
              >
                {/* Hour lines */}
                {hours.map((_, rowIdx) => (
                  <div
                    key={`line-${rowIdx}`}
                    className="absolute w-full border-t border-surface-100"
                    style={{
                      top: `${(rowIdx / hours.length) * 100}%`,
                    }}
                  />
                ))}

                {/* Appointment / event blocks */}
                {itemsByDay[dayIdx]?.map((item) => {
                  const s = new Date(item.start);
                  const e = new Date(item.end);
                  const startH = s.getHours() + s.getMinutes() / 60;
                  const endH = e.getHours() + e.getMinutes() / 60;
                  const top = ((startH - gridHours.start) / hours.length) * 100;
                  const height = ((endH - startH) / hours.length) * 100;
                  const isLead = item.source === "lead";

                  const block = (
                    <div
                      key={item.id}
                      className={`absolute left-1 right-1 border-l-[3px] rounded-r px-2 py-1 overflow-hidden transition-colors ${
                        isLead
                          ? "bg-brand-100 border-brand-500 hover:bg-brand-200"
                          : "bg-blue-50 border-blue-400 hover:bg-blue-100"
                      }`}
                      style={{
                        top: `${Math.max(0, Math.min(100, top))}%`,
                        height: `${Math.max(2, Math.min(100 - top, height))}%`,
                        minHeight: "24px",
                      }}
                    >
                      <p
                        className={`text-xs font-semibold truncate ${
                          isLead ? "text-brand-800" : "text-blue-800"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p
                        className={`text-[10px] truncate ${
                          isLead ? "text-brand-600" : "text-blue-500"
                        }`}
                      >
                        {formatTime(item.start)} – {formatTime(item.end)}
                      </p>
                    </div>
                  );

                  return isLead ? (
                    <Link key={item.id} href={`/portal/leads/${item.id}`}>
                      {block}
                    </Link>
                  ) : (
                    block
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── List view (always) ──────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-surface-900 mb-4">
          Overzicht
        </h2>
        {allItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-surface-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-surface-900">
              Geen afspraken deze week
            </h3>
            <p className="text-sm text-surface-500 mt-2 max-w-sm mx-auto">
              Zodra een klant via WhatsApp een afspraak bevestigt, verschijnt
              deze hier. Afspraken in je Google Agenda worden ook getoond.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(
              allItems.reduce<Record<string, AgendaItem[]>>(
                (groups, item) => {
                  const dateKey = new Date(
                    item.start
                  ).toLocaleDateString("nl-NL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(item);
                  return groups;
                },
                {}
              )
            ).map(([dateLabel, dayItems]) => (
              <div key={dateLabel}>
                <h3 className="text-sm font-semibold text-surface-700 mb-3 capitalize">
                  {dateLabel}
                </h3>
                <div className="space-y-3">
                  {dayItems.map((item) => {
                    const isLead = item.source === "lead";
                    const content = (
                      <div
                        className={`bg-white rounded-xl border p-5 transition-colors ${
                          isLead
                            ? "border-surface-200 hover:border-surface-300"
                            : "border-blue-100 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-semibold text-surface-900 truncate">
                                {item.title}
                              </h4>
                              <span
                                className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${
                                  isLead
                                    ? "text-brand-700 bg-brand-50"
                                    : "text-blue-700 bg-blue-50"
                                }`}
                              >
                                {formatTime(item.start)} –{" "}
                                {formatTime(item.end)}
                              </span>
                            </div>
                            {item.problem && (
                              <p className="text-sm text-surface-500 mt-1.5 truncate">
                                {item.problem}
                              </p>
                            )}
                            {item.address && (
                              <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {item.address}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {!isLead && (
                              <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                Google Agenda
                              </span>
                            )}
                            {item.urgency && (
                              <span
                                className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                  urgencyColors[item.urgency] || ""
                                }`}
                              >
                                {urgencyLabels[item.urgency] || item.urgency}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    return isLead ? (
                      <Link
                        key={item.id}
                        href={`/portal/leads/${item.id}`}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
