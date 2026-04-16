"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

function BetalenPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const status = searchParams.get("status");

  const [loading, setLoading] = useState(!status);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status || !token) return;
    // Redirect to the API which creates a Stripe session and redirects
    window.location.href = `/api/setup/checkout?t=${token}`;
  }, [token, status]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo size="sm" />
        </div>

        {/* Error / Expired */}
        {(status === "error" || status === "expired") && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">
              {status === "expired" ? "Link verlopen" : "Er ging iets mis"}
            </h1>
            <p className="text-surface-500 mt-2">
              {status === "expired"
                ? "Deze link is niet meer geldig. Vraag een nieuwe link aan bij Speed Clinics."
                : "Er ging iets mis bij het laden van de betaallink. Probeer het opnieuw of neem contact op."}
            </p>
          </div>
        )}

        {/* Loading — redirecting to Stripe */}
        {loading && !status && !error && (
          <div>
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-bold text-surface-900">Even geduld...</h1>
            <p className="text-surface-500 mt-2">Je wordt doorgestuurd naar de betaalpagina.</p>
          </div>
        )}

        {/* No token */}
        {!token && !status && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Ongeldige link</h1>
            <p className="text-surface-500 mt-2">Deze link is niet geldig. Neem contact op met Speed Clinics.</p>
          </div>
        )}

        {error && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Er ging iets mis</h1>
            <p className="text-surface-500 mt-2">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BetalenPage() {
  return (
    <Suspense>
      <BetalenPageInner />
    </Suspense>
  );
}
