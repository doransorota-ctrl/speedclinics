"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Cal, { getCalApi } from "@calcom/embed-react";
import { Logo } from "@/components/ui/Logo";

function DemoPageInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const backHref = ref === "probeer" ? "/probeer" : ref === "gids" ? "/gids" : "/";

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#C9998A" } },
      });
    })();
  }, []);

  return (
    <div className="bg-surface-50" style={{ minHeight: "100dvh" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <Link href={backHref} className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </Link>
          <Logo size="sm" />
        </div>
      </div>

      {/* Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif italic text-surface-900">
              Boek een demo
            </h1>
            <p className="mt-2 text-surface-500 max-w-lg">
              Kies een moment dat u uitkomt. In 15 minuten laten wij zien wat Clŷniq voor uw kliniek kan betekenen.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {["Persoonlijke demo", "Op maat voor uw kliniek", "Geen verplichtingen"].map((t) => (
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

      {/* Cal.com embed — full width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm shadow-black/5 p-4 sm:p-6 overflow-hidden">
          <Cal
            calLink="clyniq/15min"
            calOrigin="https://cal.com"
            style={{ width: "100%", height: "100%", overflow: "auto", minHeight: 500 }}
            config={{ layout: "month_view", theme: "light" }}
          />
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
