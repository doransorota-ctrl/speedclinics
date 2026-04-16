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
  const backHref = ref === "probeer" ? "/probeer" : ref === "gids" ? "/gids" : "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Vul uw naam in"); return; }
    if (!phone.trim()) { setError("Vul uw telefoonnummer in"); return; }

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
            <div className="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold tracking-tight">SC</span>
            </div>
            <span className="text-base font-semibold text-surface-900 tracking-tight">Speed Clinics</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Boek een demo
          </h1>
          <p className="mt-2 text-surface-500 text-sm">
            Laat uw gegevens achter. Wij nemen via WhatsApp contact op en laten zien wat wij voor uw kliniek kunnen betekenen.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-surface-100 shadow-sm shadow-black/5 p-6 space-y-4">
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
            <label className="text-sm font-semibold text-surface-900 block mb-1.5">Telefoonnummer</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+31 20 1234567"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 disabled:opacity-50"
          >
            {submitting ? "Versturen..." : "Boek een demo"}
          </button>

          <p className="text-[11px] text-surface-400 text-center">
            Wij nemen binnen een werkdag contact op via WhatsApp. Geen verplichtingen.
          </p>
        </form>

        {/* Trust */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {["Persoonlijke demo voor uw kliniek", "Volledig op maat ingericht", "Geen verplichtingen"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs text-surface-500">
              <svg className="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
