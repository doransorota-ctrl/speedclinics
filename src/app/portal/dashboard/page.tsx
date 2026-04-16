"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useBusiness } from "@/lib/hooks/useBusiness";

const PLAN_PRICES: Record<string, string> = {
  website: "€39",
  "speed-leads": "€79",
  compleet: "€118",
};

export default function DashboardPage() {
  const { business, loading } = useBusiness();
  const [stats, setStats] = useState<{
    leadsThisMonth: number;
    appointmentsCount: number;
    avgResponseTime: number | null;
  } | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [forwarding, setForwarding] = useState<boolean | null>(null);
  const [togglingForwarding, setTogglingForwarding] = useState(false);
  const [showDialCodes, setShowDialCodes] = useState(false);
  const [dialIntent, setDialIntent] = useState<"on" | "off" | null>(null); // locks the popup to on/off regardless of state changes
  const [dialStep, setDialStep] = useState(0);
  const [whatsAppSent, setWhatsAppSent] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const hasSpeedLeads = business?.plan === "speed-leads" || business?.plan === "compleet";
  const hasWebsite = business?.plan === "website" || business?.plan === "compleet";

  // Sync forwarding toggle with business state — use forwarding_confirmed as source of truth
  useEffect(() => {
    if (forwarding === null && business) {
      setForwarding(business.forwarding_confirmed ?? business.speed_leads_active ?? false);
    }
  }, [business, forwarding]);

  const toggleForwarding = useCallback(async () => {
    if (togglingForwarding || !business) return;
    setTogglingForwarding(true);
    const newState = !forwarding;
    setForwarding(newState); // Optimistic update
    try {
      const res = await fetch("/api/portal/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speed_leads_active: newState, forwarding_confirmed: newState }),
      });
      if (!res.ok) setForwarding(!newState); // Revert on failure
    } catch {
      setForwarding(!newState); // Revert on failure
    } finally {
      setTogglingForwarding(false);
    }
  }, [forwarding, togglingForwarding, business]);

  useEffect(() => {
    if (!hasSpeedLeads) return;
    fetch("/api/portal/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Stats fetch failed");
        return res.json();
      })
      .then((data) => setStats(data))
      .catch(() => setStatsError(true));
  }, [hasSpeedLeads]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Goedemorgen";
    if (hour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  const trialDaysLeft = () => {
    if (!business?.subscription_ends_at) return 0;
    const diff = new Date(business.subscription_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const firstName = business?.name?.split(" ")[0] || "";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-64" />
        <div className="h-5 bg-surface-100 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 h-24" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-8 h-48" />
      </div>
    );
  }

  const daysLeft = trialDaysLeft();

  const setupSteps = hasSpeedLeads
    ? [
        { label: "Account aangemaakt", done: true, href: null },
        { label: "Onboarding afgerond", done: !!business?.onboarding_completed_at, href: "/portal/onboarding" },
        { label: "Doorschakelen ingesteld", done: !!business?.forwarding_confirmed, href: "/portal/onboarding" },
        { label: "Agenda gekoppeld", done: business?.calendar_type === "google", href: "/api/auth/google/calendar" },
      ]
    : [];

  const completedCount = setupSteps.filter((s) => s.done).length;
  const allDone = setupSteps.length === 0 || completedCount === setupSteps.length;

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold text-surface-900">
        {greeting()}{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-surface-500 mt-1">
        {hasSpeedLeads ? "Welkom bij je Clŷniq dashboard." : "Welkom bij je portaal."}
      </p>

      {/* Call forwarding toggle */}
      {hasSpeedLeads && forwarding !== null && (
        <div className="mt-6">
          <button
            onClick={() => { setDialIntent(forwarding ? "off" : "on"); setShowDialCodes(true); }}
            className={`w-full rounded-2xl p-6 transition-all duration-300 ${
              forwarding
                ? "bg-brand-500 shadow-lg shadow-brand-500/20"
                : "bg-surface-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className={`text-lg font-bold ${forwarding ? "text-white" : "text-surface-700"}`}>
                  {forwarding ? "Doorschakelen staat aan" : "Doorschakelen staat uit"}
                </p>
                <p className={`text-sm mt-0.5 ${forwarding ? "text-white/70" : "text-surface-400"}`}>
                  {forwarding ? "Gemiste oproepen worden opgevangen" : "Zet doorschakelen aan om oproepen op te vangen"}
                </p>
              </div>
              <div className={`relative w-16 h-9 rounded-full transition-colors duration-300 ${
                forwarding ? "bg-white/20" : "bg-surface-300"
              }`}>
                <div className={`absolute top-1 w-7 h-7 rounded-full shadow-md transition-all duration-300 ${
                  forwarding ? "right-1 bg-white" : "left-1 bg-white"
                }`} />
              </div>
            </div>
          </button>

          {/* Dial code instructions popup */}
          {showDialCodes && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center" onClick={() => { setShowDialCodes(false); setDialStep(0); setWhatsAppSent(false); setDialIntent(null); }}>
              <div className="bg-white w-full rounded-t-2xl sm:rounded-2xl p-6 pb-10 sm:pb-6 sm:max-w-md sm:shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-surface-900">
                    {dialIntent === "off" ? "Doorschakelen uitzetten" : "Doorschakelen aanzetten"}
                  </h3>
                  <button onClick={() => { setShowDialCodes(false); setDialStep(0); setWhatsAppSent(false); setDialIntent(null); }} className="text-surface-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {dialIntent === "off" ? (
                  /* TURNING OFF */
                  isMobile ? (
                    <a
                      href="tel:%23%23002%23"
                      onClick={async () => {
                        setTimeout(async () => {
                          setShowDialCodes(false);
                          setDialStep(0);
                          await toggleForwarding();
                        }, 1000);
                      }}
                      className="flex items-center justify-between w-full p-5 bg-red-50 rounded-xl"
                    >
                      <div>
                        <p className="text-base font-semibold text-red-800">Doorschakelen uitzetten</p>
                        <p className="text-xs text-red-400 mt-1">Tik hierop om de code te bellen. Duurt een paar seconden.</p>
                      </div>
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  ) : (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        </svg>
                      </div>
                      <p className="text-sm text-surface-600 mb-4">Bel onderstaande code op je telefoon om doorschakelen uit te zetten:</p>
                      <div className="bg-surface-50 rounded-xl py-5 px-6 mb-3">
                        <p className="text-3xl font-mono font-bold text-surface-900 tracking-wider">##002#</p>
                      </div>
                      <p className="text-xs text-surface-400 mb-6">Na het bellen hoor je een bevestiging van je provider.</p>
                      <button
                        onClick={async () => {
                          setShowDialCodes(false); setDialIntent(null);
                          await toggleForwarding();
                        }}
                        className="w-full py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        Klaar, ik heb gebeld
                      </button>
                    </div>
                  )
                ) : (
                  /* TURNING ON */
                  isMobile ? (
                    <div className="space-y-3">
                      <a
                        href={`tel:**61*${encodeURIComponent(business?.twilio_number || "")}*11*20%23`}
                        onClick={() => setTimeout(() => setDialStep((s) => Math.max(s, 1)), 1000)}
                        className={`flex items-center justify-between w-full p-5 rounded-xl transition-all ${
                          dialStep >= 1 ? "bg-brand-100 opacity-60" : "bg-brand-50"
                        }`}
                      >
                        <div>
                          <p className="text-base font-semibold text-brand-800">
                            {dialStep >= 1 ? "✓ Ingesteld" : "Stap 1: Bij niet opnemen"}
                          </p>
                          <p className="text-xs text-brand-500 mt-1 font-mono">**61*{business?.twilio_number}*11*20#</p>
                        </div>
                        {dialStep < 1 && (
                          <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        )}
                      </a>
                      <a
                        href={`tel:**67*${encodeURIComponent(business?.twilio_number || "")}%23`}
                        onClick={() => {
                          setTimeout(async () => {
                            setDialStep(2);
                            setTimeout(async () => {
                              setShowDialCodes(false);
                              setDialStep(0);
                              await toggleForwarding();
                            }, 1500);
                          }, 1000);
                        }}
                        className={`flex items-center justify-between w-full p-5 rounded-xl transition-all ${
                          dialStep < 1 ? "bg-surface-100 opacity-40 pointer-events-none" : dialStep >= 2 ? "bg-brand-100 opacity-60" : "bg-brand-50"
                        }`}
                      >
                        <div>
                          <p className="text-base font-semibold text-brand-800">
                            {dialStep >= 2 ? "✓ Ingesteld" : "Stap 2: Bij in gesprek"}
                          </p>
                          <p className="text-xs text-brand-500 mt-1 font-mono">**67*{business?.twilio_number}#</p>
                        </div>
                        {dialStep < 2 && dialStep >= 1 && (
                          <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        )}
                      </a>
                    </div>
                  ) : (
                    /* Desktop: send WhatsApp with setup link */
                    <div className="text-center">
                      {whatsAppSent ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-green-800">Bericht verstuurd!</p>
                          <p className="text-sm text-green-600 mt-2 mb-6">Check WhatsApp op je telefoon en tik op de link om doorschakelen in te stellen.</p>
                          <button
                            onClick={() => { setShowDialCodes(false); setWhatsAppSent(false); }}
                            className="w-full py-3 text-sm font-medium text-surface-600 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors"
                          >
                            Sluiten
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </div>
                          <p className="text-sm text-surface-600 mb-4">We sturen een bericht naar je telefoon. Tik op de link in het bericht om doorschakelen in te stellen.</p>
                          <button
                            onClick={async () => {
                              setSendingWhatsApp(true);
                              try {
                                const res = await fetch("/api/portal/onboarding/send-setup-link", { method: "POST" });
                                if (res.ok) {
                                  setWhatsAppSent(true);
                                }
                              } catch {
                                // silent
                              } finally {
                                setSendingWhatsApp(false);
                              }
                            }}
                            disabled={sendingWhatsApp}
                            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
                          >
                            {sendingWhatsApp ? "Versturen..." : "Verstuur bericht naar mijn telefoon"}
                          </button>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trial banner */}
      {business?.status === "trialing" && (
        <div className="mt-4 bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-800">
                Proefperiode — nog {daysLeft} {daysLeft === 1 ? "dag" : "dagen"}
              </p>
              <p className="text-xs text-brand-700">
                Na je proefperiode betaal je {PLAN_PRICES[business.plan] || "€79"}/maand excl. BTW. Opzeggen kan altijd.
              </p>
            </div>
          </div>
          <Link href="/portal/billing" className="text-sm font-semibold text-brand-700 hover:text-brand-800 whitespace-nowrap">
            Bekijk abonnement →
          </Link>
        </div>
      )}

      {/* Website status card */}
      {hasWebsite && (
        <div className="mt-6 bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Je website</h3>
                {business?.website_url ? (
                  <a
                    href={business.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    {business.website_url.replace(/^https?:\/\//, "")} →
                  </a>
                ) : (
                  <p className="text-xs text-surface-500">Je website wordt momenteel gebouwd. We laten je weten wanneer hij live is.</p>
                )}
              </div>
            </div>
            {business?.website_url && (
              <Link href="/portal/website" className="btn-secondary text-sm whitespace-nowrap">
                Bekijk website
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Clŷniq stats */}
      {hasSpeedLeads && (
        <>
          {statsError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">Kon statistieken niet laden. Probeer de pagina te verversen.</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500">Gesprekken</p>
              </div>
              <p className="text-3xl font-bold text-surface-900">{stats?.leadsThisMonth ?? 0}</p>
              <p className="text-xs text-surface-400 mt-1">deze maand</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500">Afspraken</p>
              </div>
              <p className="text-3xl font-bold text-surface-900">{stats?.appointmentsCount ?? 0}</p>
              <p className="text-xs text-surface-400 mt-1">geboekt</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-surface-500">Reactietijd</p>
              </div>
              <p className="text-3xl font-bold text-surface-900">
                {stats?.avgResponseTime ? `${stats.avgResponseTime} min` : "\u2014"}
              </p>
              <p className="text-xs text-surface-400 mt-1">gemiddeld</p>
            </div>
          </div>
        </>
      )}

      {/* Setup checklist (Clŷniq only) */}
      {hasSpeedLeads && !allDone && (
        <div className="mt-6 bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-surface-900">Setup checklist</h2>
            <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2.5 py-1 rounded-full">
              {completedCount}/{setupSteps.length}
            </span>
          </div>
          <div className="h-1 bg-surface-100">
            <div
              className="h-full bg-brand-500 transition-all duration-500"
              style={{ width: `${(completedCount / setupSteps.length) * 100}%` }}
            />
          </div>
          <div className="divide-y divide-surface-100">
            {setupSteps.map((step, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? "bg-brand-500" : "border-2 border-surface-300"
                }`}>
                  {step.done && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${step.done ? "text-surface-400 line-through" : "text-surface-800 font-medium"}`}>
                  {step.label}
                </span>
                {!step.done && step.href && (
                  <Link href={step.href} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Instellen →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {business?.plan === "website" && (
        <div className="mt-6 bg-brand-50 border border-brand-200 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-brand-800">Meer leads opvangen?</h3>
            <p className="text-xs text-brand-700">Voeg Clŷniq toe en mis nooit meer een oproep of WhatsApp-bericht.</p>
          </div>
          <Link href="/portal/upgrade" className="btn-secondary text-sm">
            Bekijk opties →
          </Link>
        </div>
      )}
      {business?.plan === "speed-leads" && (
        <div className="mt-6 bg-brand-50 border border-brand-200 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-brand-800">Professionele website nodig?</h3>
            <p className="text-xs text-brand-700">Combineer Clŷniq met een op maat gemaakte website.</p>
          </div>
          <Link href="/portal/upgrade" className="btn-secondary text-sm">
            Bekijk opties →
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasSpeedLeads ? (
          <Link href="/portal/leads" className="bg-white rounded-xl border border-surface-200 p-5 hover:border-surface-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Bekijk gesprekken</h3>
                <p className="text-xs text-surface-500">Alle opgevangen gesprekken</p>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/portal/website" className="bg-white rounded-xl border border-surface-200 p-5 hover:border-surface-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Bekijk je website</h3>
                <p className="text-xs text-surface-500">Preview en status van je website</p>
              </div>
            </div>
          </Link>
        )}
        <Link href="/portal/settings" className="bg-white rounded-xl border border-surface-200 p-5 hover:border-surface-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
              <svg className="w-5 h-5 text-surface-500 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-900">Instellingen</h3>
              <p className="text-xs text-surface-500">Profiel, integraties en doorschakelen</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
