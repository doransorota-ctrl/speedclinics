"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/ui/Logo";

function SetupContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");

  const [number, setNumber] = useState<string | null>(null);
  const [error, setError] = useState<"expired" | "invalid" | null>(null);
  const [loading, setLoading] = useState(true);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  useEffect(() => {
    if (step1Done && step2Done && token) {
      fetch("/api/setup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  }, [step1Done, step2Done, token]);

  useEffect(() => {
    if (!token) {
      setError("invalid");
      setLoading(false);
      return;
    }

    fetch(`/api/setup/verify?t=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.number) {
          setNumber(data.number);
        } else {
          setError(data.error === "expired" ? "expired" : "invalid");
        }
      })
      .catch(() => setError("invalid"))
      .finally(() => setLoading(false));
  }, [token]);

  const num = number?.replace("+", "") || "";
  const noAnswerTel = `tel:**61*${num}*11*20%23`;
  const busyTel = `tel:**67*${num}%23`;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-sm px-6">
          <div className="h-8 bg-surface-200 rounded w-48" />
          <div className="h-5 bg-surface-100 rounded w-64" />
          <div className="h-20 bg-surface-200 rounded-xl" />
          <div className="h-20 bg-surface-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-2">
            {error === "expired" ? "Link verlopen" : "Ongeldige link"}
          </h1>
          <p className="text-sm text-surface-500">
            {error === "expired"
              ? "Deze link is verlopen. Open de Clŷniq app en stuur een nieuwe link."
              : "Deze link is niet geldig. Open de Clŷniq app en stuur een nieuwe link."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-sm mx-auto px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Logo size="sm" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-surface-900 mb-2">
          Stel doorschakelen in
        </h1>
        <p className="text-sm text-surface-500 mb-2">
          Tik op beide knoppen hieronder. Na elke knop opent je telefoon-app en belt een code — dat duurt een paar seconden.
        </p>
        <p className="text-sm text-surface-500 mb-8 font-medium">
          Kom na het bellen terug naar deze pagina om de tweede knop te tikken.
        </p>

        {/* Step 1 */}
        <div className="space-y-3 mb-8">
          <a
            href={noAnswerTel}
            onClick={() => setTimeout(() => setStep1Done(true), 1000)}
            className={`flex items-center gap-4 w-full p-5 rounded-2xl border-2 transition-all ${
              step1Done
                ? "border-brand-500 bg-brand-50"
                : "border-brand-200 bg-white hover:bg-brand-50 active:scale-[0.98]"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              step1Done ? "bg-brand-500" : "bg-brand-100"
            }`}>
              {step1Done ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Stap 1</p>
              <p className="text-base font-semibold text-surface-900">Bij geen gehoor</p>
              <p className="text-xs text-surface-500">{step1Done ? "Ingesteld" : "Tik om in te stellen"}</p>
            </div>
          </a>

          {/* Step 2 */}
          <a
            href={busyTel}
            onClick={() => setTimeout(() => setStep2Done(true), 1000)}
            className={`flex items-center gap-4 w-full p-5 rounded-2xl border-2 transition-all ${
              step2Done
                ? "border-brand-500 bg-brand-50"
                : "border-surface-200 bg-white hover:bg-surface-50 active:scale-[0.98]"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              step2Done ? "bg-brand-500" : "bg-surface-200"
            }`}>
              {step2Done ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Stap 2</p>
              <p className="text-base font-semibold text-surface-900">Bij bezet</p>
              <p className="text-xs text-surface-500">{step2Done ? "Ingesteld" : "Tik om in te stellen"}</p>
            </div>
          </a>
        </div>

        {/* Help text */}
        <p className="text-xs text-surface-400 text-center">
          Na elke stap hoor je een bevestiging van je provider.
        </p>

        {step1Done && step2Done && (
          <div className="mt-6 bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-brand-800">Doorschakeling ingesteld!</p>
            <p className="text-xs text-brand-700 mt-1">Je kunt dit venster sluiten.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupDoorschakelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-sm px-6">
          <div className="h-8 bg-surface-200 rounded w-48" />
          <div className="h-5 bg-surface-100 rounded w-64" />
          <div className="h-20 bg-surface-200 rounded-xl" />
          <div className="h-20 bg-surface-200 rounded-xl" />
        </div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
