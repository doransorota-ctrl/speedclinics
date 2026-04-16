"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { events } from "@/lib/analytics";

const calLink = process.env.NEXT_PUBLIC_CAL_LINK || "https://cal.com";

function WebsiteBedanktContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-16">
      <div className="max-w-lg mx-auto">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-surface-900">Betaling gelukt!</h1>
          <p className="mt-3 text-lg text-surface-600">
            We gaan je website bouwen. Plan nu je intake-gesprek zodat we meteen kunnen starten.
          </p>
        </div>

        {/* Intake call CTA */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Plan je intake-gesprek</h2>
              <p className="text-sm text-surface-500">15 minuten — we bespreken je wensen</p>
            </div>
          </div>

          <p className="text-sm text-surface-600 mb-6">
            In het intake-gesprek bespreken we je bedrijf, diensten en wensen. Daarna gaan we direct aan de slag met je website.
          </p>

          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => events.ctaClick("website-bedankt", "book-intake")}
            className="btn-primary w-full text-center block"
          >
            Kies een moment
          </a>

          <p className="mt-3 text-xs text-surface-400 text-center">
            Lukt het niet? Stuur een WhatsApp en we plannen het voor je.
          </p>
        </div>

        {/* What happens next */}
        <div className="mt-6 bg-white rounded-2xl border border-surface-200 p-6">
          <h3 className="font-bold text-surface-900 mb-4">Wat gebeurt er nu?</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-medium text-surface-900">Intake-gesprek (15 min)</p>
                <p className="text-sm text-surface-500">We bespreken je bedrijf en wensen</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-surface-200 text-surface-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-medium text-surface-900">Website ontwerp (2-3 dagen)</p>
                <p className="text-sm text-surface-500">Je ontvangt een preview om feedback te geven</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-surface-200 text-surface-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-medium text-surface-900">Website live (binnen 5 werkdagen)</p>
                <p className="text-sm text-surface-500">Op je eigen domeinnaam met SSL</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Login info */}
        {email && (
          <p className="mt-6 text-center text-sm text-surface-500">
            We hebben een bevestiging gestuurd naar <span className="font-medium text-surface-700">{email}</span>
          </p>
        )}

        <p className="mt-4 text-center text-sm text-surface-500">
          <Link href="/" className="text-brand-600 hover:text-brand-700 font-medium">
            Terug naar de homepage
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function WebsiteBedanktPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50 flex items-center justify-center text-surface-400">Laden...</div>}>
      <WebsiteBedanktContent />
    </Suspense>
  );
}
