"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusiness } from "@/lib/hooks/useBusiness";
import Cal, { getCalApi } from "@calcom/embed-react";

const FEATURE_CHECK = (
  <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

type UpgradePlan = "speed-leads" | "website" | "compleet";

export default function UpgradePage() {
  const { business, loading } = useBusiness();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<UpgradePlan | null>(null);
  const [demoBooked, setDemoBooked] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init Cal.com listener when demo step is shown
  useEffect(() => {
    if (selectedPlan && needsDemo(selectedPlan)) {
      (async () => {
        const cal = await getCalApi();
        cal("ui", { theme: "light", styles: { branding: { brandColor: "#6366f1" } } });
        cal("on", {
          action: "bookingSuccessfulV2",
          callback: () => setDemoBooked(true),
        });
      })();
    }
  }, [selectedPlan]);

  const needsDemo = (plan: UpgradePlan) =>
    (plan === "website" || plan === "compleet") && business?.plan === "speed-leads";

  const handleUpgrade = async (plan: UpgradePlan) => {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/portal/billing?success=true");
      } else {
        setError(data.error || "Upgrade mislukt");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-64" />
        <div className="h-5 bg-surface-100 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 p-6 h-64" />
          <div className="bg-white rounded-xl border border-surface-200 p-6 h-64" />
        </div>
      </div>
    );
  }

  if (business?.plan === "compleet") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Upgrade</h1>
        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-surface-900">Je hebt al het Compleet pakket</h2>
          <p className="text-sm text-surface-500 mt-1">Je hebt toegang tot alle functies van clŷniq.</p>
        </div>
      </div>
    );
  }

  // Demo booking step
  if (selectedPlan && needsDemo(selectedPlan) && !demoBooked) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Plan een demo</h1>
        <p className="text-surface-500 mb-6">Boek een gesprek en we bespreken je website-wensen.</p>

        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 sm:p-6 max-h-[600px] overflow-y-auto">
          <Cal
            calLink="speedleads-crbikd/15min"
            calOrigin="https://cal.com"
            style={{ width: "100%", height: "100%", overflow: "auto" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => { setSelectedPlan(null); setDemoBooked(false); }}
            className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug
          </button>
          <button disabled className="btn-primary flex-1 opacity-40">
            Plan eerst een demo
          </button>
        </div>
      </div>
    );
  }

  // Demo booked — confirm upgrade
  if (selectedPlan && needsDemo(selectedPlan) && demoBooked) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Demo gepland</h1>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-brand-700">Demo ingepland</span>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={() => handleUpgrade(selectedPlan)}
          disabled={upgrading}
          className="btn-primary w-full"
        >
          {upgrading ? "Bezig met upgraden..." : `Upgrade naar ${selectedPlan === "compleet" ? "Compleet" : "Website"}`}
        </button>
      </div>
    );
  }

  // Plan selection
  const currentPlan = business?.plan || "speed-leads";
  const isSpeedLeads = currentPlan === "speed-leads";
  const isWebsite = currentPlan === "website";

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">Upgrade je pakket</h1>
      <p className="text-surface-500 mt-1">
        Je hebt nu het {isSpeedLeads ? "clŷniq" : "Website"} pakket. Kies een upgrade.
      </p>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <div className={`mt-6 grid grid-cols-1 ${isSpeedLeads || isWebsite ? "md:grid-cols-2" : ""} gap-4`}>
        {/* clŷniq card — shown to website users */}
        {isWebsite && (
          <div className="bg-white rounded-2xl border-2 border-brand-500 shadow-lg p-6 flex flex-col">
            <span className="inline-block bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
              Populair
            </span>
            <h3 className="text-lg font-bold text-surface-900">clŷniq</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-surface-900">&euro;79</span>
              <span className="text-surface-500">/maand</span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">excl. BTW &middot; bovenop je huidige pakket</p>
            <ul className="mt-4 space-y-2 flex-1">
              {["Gemiste oproepen \u2192 WhatsApp", "AI plant afspraken in", "Google Agenda-koppeling", "Herinneringen voor klanten", "Automatische review-verzoeken"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                  {FEATURE_CHECK}
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade("speed-leads")}
              disabled={upgrading}
              className="btn-primary w-full mt-5"
            >
              {upgrading ? "Bezig..." : "Voeg clŷniq toe"}
            </button>
          </div>
        )}

        {/* Website card — shown to speed-leads users */}
        {isSpeedLeads && (
          <div className="bg-white rounded-2xl border border-surface-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-surface-900">Website Pakket</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-surface-900">&euro;500</span>
              <span className="text-surface-500"> + &euro;39/m</span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">excl. BTW &middot; eenmalig + maandelijks</p>
            <ul className="mt-4 space-y-2 flex-1">
              {["Professionele website in 5 dagen", "Hosting + SSL + domein", "Responsive design", "SEO-geoptimaliseerd", "Technisch onderhoud"].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                  {FEATURE_CHECK}
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan("website")}
              className="w-full mt-5 py-2.5 rounded-xl border-2 border-surface-300 text-surface-700 font-semibold hover:border-surface-400 hover:bg-surface-50 transition-colors"
            >
              Plan een demo
            </button>
          </div>
        )}

        {/* Compleet card — shown to both */}
        <div className="relative bg-white rounded-2xl border border-surface-200 p-6 flex flex-col">
          <span className="inline-block bg-surface-800 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
            Beste waarde
          </span>
          <h3 className="text-lg font-bold text-surface-900">Compleet Pakket</h3>
          <div className="mt-2">
            {isSpeedLeads ? (
              <>
                <span className="text-3xl font-bold text-surface-900">&euro;500</span>
                <span className="text-surface-500"> + &euro;118/m</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-surface-900">&euro;118</span>
                <span className="text-surface-500">/maand</span>
              </>
            )}
          </div>
          <p className="text-xs text-surface-400 mt-0.5">
            excl. BTW {isSpeedLeads ? "· eenmalig + maandelijks" : "· vervangt je huidige €39/m"}
          </p>
          <ul className="mt-4 space-y-2 flex-1">
            {["Alles van clŷniq", "Alles van Website Pakket", "Website + leadopvolging in \u00e9\u00e9n", "E\u00e9n factuur, geen gedoe"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                {FEATURE_CHECK}
                {f}
              </li>
            ))}
          </ul>
          {isSpeedLeads ? (
            <button
              onClick={() => setSelectedPlan("compleet")}
              className="w-full mt-5 py-2.5 rounded-xl border-2 border-surface-300 text-surface-700 font-semibold hover:border-surface-400 hover:bg-surface-50 transition-colors"
            >
              Plan een demo
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade("compleet")}
              disabled={upgrading}
              className="btn-primary w-full mt-5"
            >
              {upgrading ? "Bezig..." : "Upgrade naar Compleet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
