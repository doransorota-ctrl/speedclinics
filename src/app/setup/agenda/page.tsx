"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function AgendaPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const status = searchParams.get("status");

  const [loading, setLoading] = useState(!status);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status || !token) return;
    fetch(`/api/setup/verify?t=${token}`)
      .then((res) => {
        if (res.ok) setValid(true);
        else setError("Link is verlopen. Vraag een nieuwe link aan.");
      })
      .catch(() => setError("Er ging iets mis."))
      .finally(() => setLoading(false));
  }, [token, status]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-surface-900">Speed Leads</span>
        </div>

        {/* Success state */}
        {status === "connected" && (
          <div>
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Google Agenda gekoppeld!</h1>
            <p className="text-surface-500 mt-2">Afspraken worden nu automatisch in je agenda gezet. Je kunt dit venster sluiten.</p>
          </div>
        )}

        {/* Denied */}
        {status === "denied" && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Geen toestemming gegeven</h1>
            <p className="text-surface-500 mt-2">Je hebt geen toestemming gegeven om je agenda te koppelen. Klik opnieuw op de link in je WhatsApp om het nog een keer te proberen.</p>
          </div>
        )}

        {/* Error / Expired */}
        {(status === "error" || status === "expired") && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Link verlopen</h1>
            <p className="text-surface-500 mt-2">Deze link is niet meer geldig. Vraag een nieuwe link aan bij Speed Leads.</p>
          </div>
        )}

        {/* Loading */}
        {loading && !status && (
          <div className="animate-pulse">
            <div className="h-8 bg-surface-200 rounded w-48 mx-auto mb-4" />
            <div className="h-5 bg-surface-100 rounded w-64 mx-auto" />
          </div>
        )}

        {/* Error from verification */}
        {error && !status && (
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Link verlopen</h1>
            <p className="text-surface-500 mt-2">{error}</p>
          </div>
        )}

        {/* Valid token — show connect button */}
        {valid && !status && !loading && (
          <div>
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Koppel je Google Agenda</h1>
            <p className="text-surface-500 mt-2 mb-6">
              Hiermee kan Speed Leads afspraken automatisch inplannen in jouw agenda.
            </p>
            <a
              href={`/api/setup/calendar/connect?t=${token}`}
              className="btn-primary text-lg px-8 py-4 w-full inline-block"
            >
              Koppel Google Agenda
            </a>
            <p className="text-xs text-surface-400 mt-3">
              We kunnen alleen afspraken toevoegen. Je gegevens zijn veilig.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaPageInner />
    </Suspense>
  );
}
