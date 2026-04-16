"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Er ging iets mis. Probeer het later opnieuw.");
      }
    } catch {
      setError("Netwerkfout. Controleer je verbinding en probeer opnieuw.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1 mb-6">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <Logo size="sm" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">Neem contact op</h1>
        <p className="mt-2 text-surface-500 mb-8">
          Stuur ons een bericht en we reageren binnen 24 uur.
        </p>

        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-surface-900 font-semibold">Bericht verstuurd!</p>
              <p className="text-sm text-surface-500 mt-2">
                We nemen zo snel mogelijk contact met je op.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Naam</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Jan Bakker"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">E-mailadres</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="jan@bedrijf.nl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Telefoonnummer</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+31 6 12345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Bericht</label>
                <textarea
                  required
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Vertel ons waarmee we je kunnen helpen..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full"
              >
                {sending ? "Versturen..." : "Verstuur bericht"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6">
          <p className="text-xs text-surface-400">
            Of mail ons direct op{" "}
            <a href="mailto:info@clyniq.nl" className="text-brand-600 hover:text-brand-700 font-medium">
              info@clyniq.nl
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
