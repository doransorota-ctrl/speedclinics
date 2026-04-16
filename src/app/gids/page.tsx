"use client";

import { useState } from "react";
import Link from "next/link";
import { events } from "@/lib/analytics";
import { getTrackingData } from "@/lib/utm";

const GUIDE_TOPICS = [
  "Waarom 40% van de patiënten buiten openingstijden contact opneemt",
  "De 5 grootste fouten die klinieken maken met hun online aanwezigheid",
  "Hoe u uw website optimaliseert voor meer consulten",
  "WhatsApp als conversiemiddel: van aanvraag naar consult",
  "Automatische reviews: hoe u uw reputatie versterkt",
  "Checklist: is uw kliniek 24/7 bereikbaar?",
];

export default function GidsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Vul uw naam in"); return; }
    if (!email.trim() || !email.includes("@")) { setError("Vul een geldig e-mailadres in"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: "",
          email: email.trim(),
          source: "gids",
          ...getTrackingData(),
        }),
      });

      if (res.ok) {
        events.formSubmit("demo");
        setSubmitted(true);
      } else {
        setError("Er ging iets mis. Probeer het opnieuw.");
      }
    } catch {
      setError("Netwerkfout. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-50" style={{ minHeight: "100dvh" }}>
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold tracking-tight">SC</span>
            </div>
            <span className="text-base font-semibold text-surface-900 tracking-tight">Speed Clinics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pb-16">
          {/* Left — content */}
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700 mb-4">
              Gratis gids
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 leading-tight">
              De online aanwezigheid van uw kliniek verbeteren
            </h1>
            <p className="mt-4 text-lg text-surface-500 leading-relaxed">
              Een praktische gids voor kliniekeigenaren die meer patiënten willen bereiken,
              minder aanvragen willen missen en hun online reputatie willen versterken.
            </p>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-surface-700 mb-4">In deze gids leert u:</h3>
              <ul className="space-y-3">
                {GUIDE_TOPICS.map((topic) => (
                  <li key={topic} className="flex items-start gap-2.5 text-sm text-surface-600">
                    <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:sticky lg:top-24">
            {submitted ? (
              <div className="bg-white rounded-2xl border border-surface-100 shadow-sm shadow-black/5 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-surface-900">De gids is onderweg!</h2>
                <p className="mt-2 text-sm text-surface-500">
                  U ontvangt de gids binnen enkele minuten op {email}.
                  Controleer eventueel uw spam-map.
                </p>
                <Link href="/demo" className="btn-primary mt-6 inline-flex">
                  Boek ook een demo
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-surface-100 shadow-sm shadow-black/5 p-8">
                <h2 className="text-xl font-bold text-surface-900 mb-1">
                  Download de gratis gids
                </h2>
                <p className="text-sm text-surface-500 mb-6">
                  Vul uw gegevens in en ontvang de gids direct per e-mail.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-surface-900 block mb-1.5">Naam</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Lisa van der Berg"
                      className="input-field"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-surface-900 block mb-1.5">E-mailadres</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@kliniekesthetique.nl"
                      className="input-field"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3.5 disabled:opacity-50"
                  >
                    {submitting ? "Versturen..." : "Download gratis gids"}
                  </button>

                  <p className="text-[11px] text-surface-400 text-center">
                    Geen spam. Wij respecteren uw privacy.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
