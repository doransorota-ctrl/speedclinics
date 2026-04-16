"use client";

import { useState, useRef, useEffect } from "react";

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: "NL", dial: "+31", flag: "🇳🇱", name: "Nederland" },
  { code: "BE", dial: "+32", flag: "🇧🇪", name: "België" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Duitsland" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "Frankrijk" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "Verenigd Koninkrijk" },
];

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
}

/** Parse an E.164 phone into { country, local }. */
function parsePhone(phone: string): { country: Country; local: string } {
  if (!phone) return { country: COUNTRIES[0], local: "" };

  // Try to match a known country code
  for (const c of COUNTRIES) {
    if (phone.startsWith(c.dial)) {
      return { country: c, local: phone.slice(c.dial.length) };
    }
  }

  // Dutch local format: 06... → strip leading 0
  if (phone.startsWith("0") && phone.length >= 10) {
    return { country: COUNTRIES[0], local: phone.slice(1) };
  }

  // Unknown — default to NL
  return { country: COUNTRIES[0], local: phone };
}

export function PhoneInput({ value, onChange }: PhoneInputProps) {
  const parsed = parsePhone(value || "");
  const [country, setCountry] = useState<Country>(parsed.country);
  const [local, setLocal] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync from external value changes
  useEffect(() => {
    const p = parsePhone(value || "");
    setCountry(p.country);
    setLocal(p.local);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const emit = (c: Country, l: string) => {
    // Strip leading 0 from local number
    const cleaned = l.replace(/^0+/, "").replace(/[^\d]/g, "");
    onChange(cleaned ? `${c.dial}${cleaned}` : "");
  };

  const handleLocalChange = (val: string) => {
    // Allow only digits, spaces, dashes
    const sanitized = val.replace(/[^\d\s-]/g, "");
    setLocal(sanitized);
    emit(country, sanitized);
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    emit(c, local);
  };

  return (
    <div ref={ref} className="relative flex">
      {/* Country selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-3 rounded-l-lg border border-r-0 border-surface-300 bg-surface-50 hover:bg-surface-100 transition-colors text-sm shrink-0"
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="text-surface-600">{country.dial}</span>
        <svg className="w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-20 min-w-[200px]">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => selectCountry(c)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-50 transition-colors ${
                c.code === country.code ? "bg-brand-50 text-brand-700" : "text-surface-700"
              }`}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-surface-400">{c.dial}</span>
            </button>
          ))}
        </div>
      )}

      {/* Phone number input */}
      <input
        type="tel"
        className="input-field !rounded-l-none"
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        placeholder="612345678"
      />
    </div>
  );
}
