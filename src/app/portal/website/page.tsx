"use client";

import { useBusiness } from "@/lib/hooks/useBusiness";

export default function WebsitePage() {
  const { business, loading } = useBusiness();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-64" />
        <div className="h-5 bg-surface-100 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200" style={{ height: "70vh" }} />
      </div>
    );
  }

  if (business?.plan === "speed-leads") {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-8 text-center">
        <p className="text-surface-500">Deze pagina is niet beschikbaar voor jouw pakket.</p>
      </div>
    );
  }

  const websiteUrl = business?.website_url;

  // Validate URL — only allow HTTPS, block internal/local addresses
  const isValidUrl = (() => {
    if (!websiteUrl) return false;
    try {
      const parsed = new URL(websiteUrl);
      if (parsed.protocol !== "https:") return false;
      const blocked = ["localhost", "127.", "169.254.", "10.", "172.16.", "192.168.", "0.0.0.0"];
      if (blocked.some(b => parsed.hostname.startsWith(b))) return false;
      return true;
    } catch {
      return false;
    }
  })();

  if (!websiteUrl) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Je website</h1>
        <p className="text-surface-500 mt-1">Status van je website.</p>

        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Je website wordt gebouwd</h2>
          <p className="text-sm text-surface-500 max-w-md mx-auto">
            We zijn je website aan het bouwen. Je ontvangt een bericht zodra hij live staat.
            Dit duurt gemiddeld 3–5 werkdagen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Je website</h1>
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            {websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm flex items-center gap-2"
        >
          Open in nieuw tabblad
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {isValidUrl ? (
          <iframe
            src={websiteUrl}
            title="Website preview"
            className="w-full border-0"
            style={{ height: "70vh" }}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-surface-500">Website preview niet beschikbaar. Gebruik de knop hierboven om de site te openen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
