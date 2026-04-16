"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const TRADE_OPTIONS = [
  "Loodgieter",
  "Elektricien",
  "Schilder",
  "Dakdekker",
  "Timmerman",
  "Stukadoor",
  "Installateur",
  "Glaszetter",
  "Slotenmaker",
  "CV-monteur",
  "Anders",
];

export default function NieuweKlantPage() {
  const router = useRouter();

  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [plan, setPlan] = useState("speed-leads");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [slotDuration, setSlotDuration] = useState("120");
  const [maxAppointments, setMaxAppointments] = useState("4");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!contactName.trim()) newErrors.contactName = "Contactpersoon is verplicht";
    if (!businessName.trim()) newErrors.businessName = "Bedrijfsnaam is verplicht";
    if (!phone.trim()) newErrors.phone = "Telefoon is verplicht";
    if (!email.trim()) newErrors.email = "Email is verplicht";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Ongeldig emailadres";
    if (!trade) newErrors.trade = "Vakgebied is verplicht";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/klanten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          trade,
          serviceArea: serviceArea.trim(),
          plan,
          googleReviewLink: googleReviewLink.trim() || undefined,
          slotDuration: parseInt(slotDuration) || 120,
          maxAppointments: parseInt(maxAppointments) || 4,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setGeneralError(data.error || "Er ging iets mis bij het aanmaken");
        return;
      }

      const data = await res.json();
      router.push(`/portal/admin/klanten/${data.businessId}`);
    } catch {
      setGeneralError("Netwerkfout. Probeer opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/portal/admin/klanten" className="text-sm text-surface-500 hover:text-surface-700 mb-4 inline-block">
        &larr; Terug naar klanten
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-6">Nieuwe klant</h1>

      {generalError && (
        <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4 text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Contactpersoon</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className={`input-field ${errors.contactName ? "border-red-300" : ""}`}
            />
            {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
          </div>

          <div>
            <label className="input-label">Bedrijfsnaam</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={`input-field ${errors.businessName ? "border-red-300" : ""}`}
            />
            {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
          </div>

          <div>
            <label className="input-label">Telefoon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 6 12345678"
              className={`input-field ${errors.phone ? "border-red-300" : ""}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-field ${errors.email ? "border-red-300" : ""}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="input-label">Vakgebied</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className={`input-field ${errors.trade ? "border-red-300" : ""}`}
            >
              <option value="">Selecteer...</option>
              {TRADE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.trade && <p className="text-red-500 text-xs mt-1">{errors.trade}</p>}
          </div>

          <div>
            <label className="input-label">Regio <span className="text-surface-400 font-normal">(optioneel)</span></label>
            <input
              type="text"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="Bijv. Amsterdam en omstreken"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="input-field"
            >
              <option value="speed-leads">Speed Clinics</option>
              <option value="website">Website</option>
              <option value="compleet">Compleet</option>
            </select>
          </div>

          <div>
            <label className="input-label">Klusduur <span className="text-surface-400 font-normal">(min)</span></label>
            <select value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} className="input-field">
              <option value="30">30 min</option>
              <option value="60">1 uur</option>
              <option value="90">1,5 uur</option>
              <option value="120">2 uur</option>
              <option value="180">3 uur</option>
              <option value="240">4 uur</option>
            </select>
          </div>

          <div>
            <label className="input-label">Max afspraken/dag</label>
            <select value={maxAppointments} onChange={(e) => setMaxAppointments(e.target.value)} className="input-field">
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="input-label">Google Review link <span className="text-surface-400 font-normal">(optioneel)</span></label>
          <input
            type="url"
            value={googleReviewLink}
            onChange={(e) => setGoogleReviewLink(e.target.value)}
            placeholder="https://g.page/r/..."
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full sm:w-auto px-8 py-3 text-sm disabled:opacity-50"
        >
          {submitting ? "Aanmaken..." : "Klant aanmaken"}
        </button>
      </form>
    </div>
  );
}
