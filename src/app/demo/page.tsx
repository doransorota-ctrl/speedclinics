"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { events } from "@/lib/analytics";
import { getTrackingData } from "@/lib/utm";

function DemoPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");
  const backHref = ref === "probeer" ? "/probeer" : ref === "calculator" ? "/calculator" : ref === "website" ? "/website" : "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Vul je naam in"); return; }
    if (!phone.trim()) { setError("Vul je telefoonnummer in"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          ...getTrackingData(),
        }),
      });

      if (res.ok) {
        events.formSubmit("demo");
        router.push("/demo/bedankt");
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
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href={backHref} className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold text-surface-900">Speed Leads</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Gratis laten instellen
          </h1>
          <p className="mt-2 text-surface-500 text-sm">
            Laat je gegevens achter. We nemen via WhatsApp contact op en stellen alles voor je in. Duurt 10 minuten.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-surface-900 block mb-1.5">Naam</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Jan de Vries"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-surface-900 block mb-1.5">Telefoonnummer</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12345678"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all disabled:opacity-50"
          >
            {submitting ? "Versturen..." : "Stuur me een WhatsApp"}
          </button>

          <p className="text-[11px] text-surface-400 text-center">
            We appen je binnen een paar uur. Geen spam, geen verplichtingen.
          </p>
        </form>

        {/* Trust */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {["14 dagen gratis proberen", "Instellen duurt 10 minuten", "Geen contract, opzeggen kan altijd"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs text-surface-500">
              <svg className="w-3.5 h-3.5 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense>
      <DemoPageInner />
    </Suspense>
  );
}
