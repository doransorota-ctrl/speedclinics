"use client";

import { useState, useEffect } from "react";

export type DayHours = { start: string; end: string } | null;
export type WeekHours = {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
};

const DAYS: { key: keyof WeekHours; label: string }[] = [
  { key: "mon", label: "Maandag" },
  { key: "tue", label: "Dinsdag" },
  { key: "wed", label: "Woensdag" },
  { key: "thu", label: "Donderdag" },
  { key: "fri", label: "Vrijdag" },
  { key: "sat", label: "Zaterdag" },
  { key: "sun", label: "Zondag" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const DEFAULT_HOURS: WeekHours = {
  mon: { start: "08:00", end: "17:00" },
  tue: { start: "08:00", end: "17:00" },
  wed: { start: "08:00", end: "17:00" },
  thu: { start: "08:00", end: "17:00" },
  fri: { start: "08:00", end: "17:00" },
  sat: null,
  sun: null,
};

interface BusinessHoursProps {
  value?: WeekHours | null;
  onChange: (hours: WeekHours) => void;
}

export function BusinessHours({ value, onChange }: BusinessHoursProps) {
  const [hours, setHours] = useState<WeekHours>(value || DEFAULT_HOURS);

  useEffect(() => {
    if (value) setHours(value);
  }, [value]);

  const updateDay = (day: keyof WeekHours, field: "start" | "end", val: string) => {
    const updated = {
      ...hours,
      [day]: { ...(hours[day] || { start: "08:00", end: "17:00" }), [field]: val },
    };
    setHours(updated);
    onChange(updated);
  };

  const toggleDay = (day: keyof WeekHours) => {
    const updated = {
      ...hours,
      [day]: hours[day] ? null : { start: "08:00", end: "17:00" },
    };
    setHours(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const isOpen = hours[key] !== null;
        return (
          <div key={key} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleDay(key)}
              className={`w-16 sm:w-24 text-left text-sm font-medium py-2 px-3 rounded-lg border transition-all ${
                isOpen
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-surface-50 border-surface-200 text-surface-400 line-through"
              }`}
            >
              {label.slice(0, 2)}
            </button>
            {isOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={hours[key]!.start}
                  onChange={(e) => updateDay(key, "start", e.target.value)}
                  className="input-field !py-2 text-sm flex-1"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-surface-400 text-sm">—</span>
                <select
                  value={hours[key]!.end}
                  onChange={(e) => updateDay(key, "end", e.target.value)}
                  className="input-field !py-2 text-sm flex-1"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-sm text-surface-400 italic">Gesloten</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { DEFAULT_HOURS };
