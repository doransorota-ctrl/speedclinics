"use client";

import { useState, useEffect } from "react";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { BusinessHours, DEFAULT_HOURS, type WeekHours } from "@/components/BusinessHours";

type Step = "profile" | "forwarding" | "calendar" | "hours" | "appointments" | "complete";

const STEPS: { key: Step; label: string }[] = [
  { key: "profile", label: "Profiel" },
  { key: "forwarding", label: "Doorschakelen" },
  { key: "calendar", label: "Agenda" },
  { key: "hours", label: "Werktijden" },
  { key: "appointments", label: "Afspraken" },
  { key: "complete", label: "Klaar" },
];

export default function OnboardingPage() {
  const { business, loading } = useBusiness();
  const [currentStep, setCurrentStep] = useState<Step>("profile");
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [businessName, setBusinessName] = useState("");
  const [trade, setTrade] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  // Business hours
  const [availableHours, setAvailableHours] = useState<WeekHours>(DEFAULT_HOURS);

  // Appointment settings
  const [slotDuration, setSlotDuration] = useState(60);
  const [maxPerDay, setMaxPerDay] = useState(4);

  // Forwarding UI
  const [phonePlatform, setPhonePlatform] = useState<"iphone" | "android">("iphone");
  const [copied, setCopied] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const [assigningNumber, setAssigningNumber] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Complete step
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [reviewInfoOpen, setReviewInfoOpen] = useState(false);

  // If no twilio_number assigned, try to assign one automatically
  useEffect(() => {
    if (business && !business.twilio_number && !assigningNumber) {
      handleAssignNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.twilio_number]);

  // Detect mobile vs desktop
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Resume from last saved step
  useEffect(() => {
    if (business) {
      setBusinessName(business.name || "");
      setTrade(business.trade || "");
      setServiceArea(business.service_area || "");
      if (business.available_hours) {
        setAvailableHours(business.available_hours as WeekHours);
      }
      if (business.slot_duration_minutes) {
        setSlotDuration(business.slot_duration_minutes);
      }
      if (business.max_appointments_per_day) {
        setMaxPerDay(business.max_appointments_per_day);
      }

      // Resume from saved onboarding step
      const step = business.onboarding_step as Step;
      if (step && STEPS.some((s) => s.key === step)) {
        // If onboarding is already complete, go to complete step
        if (business.onboarding_completed_at) {
          setCurrentStep("complete");
        } else {
          setCurrentStep(step);
        }
      }
    }
  }, [business]);

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const saveStep = async (step: string, data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleProfile = async () => {
    const ok = await saveStep("profile", {
      name: businessName,
      trade,
      service_area: serviceArea,
    });
    if (ok) setCurrentStep("forwarding");
  };

  const handleForwarding = async (confirmed: boolean) => {
    const ok = await saveStep("forwarding", { confirmed });
    if (ok) setCurrentStep("calendar");
  };

  const handleCalendar = async () => {
    const ok = await saveStep("calendar", {});
    if (ok) setCurrentStep("hours");
  };

  const handleHours = async () => {
    const ok = await saveStep("hours", { available_hours: availableHours });
    if (ok) setCurrentStep("appointments");
  };

  const handleAppointments = async () => {
    const ok = await saveStep("appointments", {
      slot_duration_minutes: slotDuration,
      max_appointments_per_day: maxPerDay,
    });
    if (ok) setCurrentStep("complete");
  };

  // Build forwarding number — only use the business's own bought number
  const forwardNumber = business?.twilio_number || null;

  const handleAssignNumber = async () => {
    setAssigningNumber(true);
    setAssignError(null);
    try {
      const res = await fetch("/api/portal/onboarding/assign-number", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.phone) {
        // Refresh business data to pick up the new number
        window.location.reload();
      } else {
        setAssignError(data.error || "Nummer toewijzen mislukt");
      }
    } catch {
      setAssignError("Verbindingsfout. Probeer opnieuw.");
    } finally {
      setAssigningNumber(false);
    }
  };

  const copyNumber = () => {
    if (forwardNumber) {
      navigator.clipboard.writeText(forwardNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendSetupLink = async () => {
    setSendingLink(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/portal/onboarding/send-setup-link", { method: "POST" });
      if (res.ok) {
        setLinkSent(true);
      } else {
        const data = await res.json();
        setLinkError(data.error || "Versturen mislukt");
      }
    } catch {
      setLinkError("Verbindingsfout. Probeer opnieuw.");
    } finally {
      setSendingLink(false);
    }
  };

  // Build tel: links for GSM forwarding codes
  const noAnswerTel = forwardNumber ? `tel:**61*${forwardNumber.replace("+", "")}*11*20%23` : "";
  const busyTel = forwardNumber ? `tel:**67*${forwardNumber.replace("+", "")}%23` : "";

  const handleComplete = async () => {
    // Upload logo first if one was selected
    if (logoFile) {
      setLogoUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", logoFile);
        await fetch("/api/portal/upload/profile-picture", { method: "POST", body: formData });
      } catch {
        // Non-fatal — logo can be added later in settings
      } finally {
        setLogoUploading(false);
      }
    }
    await saveStep("complete", { google_review_link: googleReviewLink || undefined });
    window.location.href = "/portal/dashboard";
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-200 rounded w-full" />
          <div className="h-64 bg-surface-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / (STEPS.length - 1)) * 100);

  return (
    <div className="max-w-lg mx-auto py-4">
      {/* Progress bar */}
      <div className="h-1 bg-surface-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-xs text-surface-400 uppercase tracking-wide mb-2 text-center">
        Stap {currentIndex + 1} van {STEPS.length} — {STEPS[currentIndex].label}
      </p>

      {/* Step: Profile */}
      {currentStep === "profile" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">
            Klopt dit?
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            Controleer je bedrijfsgegevens. Clŷniq gebruikt deze informatie om je klanten te begroeten.
          </p>
          <div className="space-y-4">
            <div>
              <label className="input-label">Bedrijfsnaam</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jansen Loodgieters"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Vakgebied</label>
              <input
                type="text"
                className="input-field"
                placeholder="Loodgieter"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Werkgebied</label>
              <input
                type="text"
                className="input-field"
                placeholder="Amsterdam en omstreken"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleProfile}
            disabled={saving}
            className="btn-primary w-full mt-6"
          >
            {saving ? "Opslaan..." : "Klopt, ga verder"}
          </button>
        </div>
      )}

      {/* Step: Forwarding */}
      {currentStep === "forwarding" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-2">
            Stel doorschakelen in
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            Als je niet opneemt of de rode knop indrukt, vangt Clŷniq de oproep automatisch op.
          </p>

          {!forwardNumber ? (
            <>
              {/* No number assigned yet */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4 text-center">
                <p className="text-sm text-amber-800 mb-3">
                  {assigningNumber ? "Nummer wordt aangemaakt..." : "Je Clŷniq nummer wordt klaargezet."}
                </p>
                {assignError && (
                  <p className="text-xs text-red-600 mb-3">{assignError}</p>
                )}
                {!assigningNumber && (
                  <button
                    onClick={handleAssignNumber}
                    className="btn-primary text-sm px-5 py-2.5"
                  >
                    Opnieuw proberen
                  </button>
                )}
              </div>
            </>
          ) : isMobile ? (
            <>
              {/* Mobile: tap-to-dial buttons */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Stap 1</p>
                  <a
                    href={noAnswerTel}
                    className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-brand-200 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">Bij geen gehoor instellen</p>
                      <p className="text-xs text-surface-500">Bel laten overgaan → doorschakelen</p>
                    </div>
                  </a>
                </div>

                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Stap 2</p>
                  <a
                    href={busyTel}
                    className="flex items-center gap-3 w-full p-4 rounded-xl border-2 border-surface-200 bg-surface-50 hover:bg-surface-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-600 text-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">Bij bezet instellen</p>
                      <p className="text-xs text-surface-500">Rode knop of in gesprek → doorschakelen</p>
                    </div>
                  </a>
                </div>
              </div>

              <p className="text-xs text-surface-400 mb-6 text-center">
                Na elke stap hoor je een bevestiging van je provider.
              </p>
            </>
          ) : (
            <>
              {/* Desktop: send link to phone */}
              <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-4 text-center">
                <p className="text-sm text-surface-600 mb-3">
                  Doorschakelen stel je in op je telefoon. Open deze pagina op je telefoon of stuur de link.
                </p>
                <button
                  onClick={handleSendSetupLink}
                  disabled={sendingLink || linkSent}
                  className="btn-primary text-sm px-5 py-2.5"
                >
                  {linkSent ? "Link verstuurd!" : sendingLink ? "Versturen..." : "Stuur link naar mijn telefoon"}
                </button>
                {linkError && (
                  <p className="text-xs text-red-600 mt-2">{linkError}</p>
                )}
              </div>

              {/* Show the number to copy */}
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-surface-500 mb-1">Doorschakelnummer:</p>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-brand-700">{forwardNumber || "Laden..."}</p>
                  {forwardNumber && (
                    <button onClick={copyNumber} className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-100 hover:bg-brand-200 px-2.5 py-1 rounded-md transition-colors">
                      {copied ? "Gekopieerd!" : "Kopieer"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-surface-400 mt-2">
                  Bij geen gehoor: <code className="bg-white px-1 rounded">**61*{forwardNumber?.replace("+", "")}*11*20#</code>
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  Bij bezet: <code className="bg-white px-1 rounded">**67*{forwardNumber?.replace("+", "")}#</code>
                </p>
              </div>
            </>
          )}

          <p className="text-xs text-surface-400 text-center mb-2">
            Je kunt dit testen door iemand je te laten bellen. Neem niet op — als het goed is krijg je een WhatsApp van Clŷniq.
          </p>

          {/* Collapsible manual instructions */}
          <button
            onClick={() => setManualOpen(!manualOpen)}
            className="w-full text-left text-xs text-surface-400 hover:text-surface-600 mt-4 flex items-center gap-1"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${manualOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Liever handmatig instellen?
          </button>
          {manualOpen && (
            <div className="mt-3 border-t border-surface-100 pt-3">
              <div className="flex gap-1 mb-3 bg-surface-100 rounded-lg p-1">
                <button onClick={() => setPhonePlatform("iphone")} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${phonePlatform === "iphone" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500"}`}>iPhone</button>
                <button onClick={() => setPhonePlatform("android")} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${phonePlatform === "android" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500"}`}>Android</button>
              </div>
              {phonePlatform === "iphone" ? (
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs text-surface-600">
                  <li>Open <strong>Instellingen</strong> → <strong>Apps</strong> → <strong>Telefoon</strong></li>
                  <li>Tik op <strong>Doorschakelen</strong> → <strong>Bij geen gehoor</strong></li>
                  <li>Vul het Clŷniq nummer in</li>
                  <li>Herhaal voor <strong>Bij bezet</strong></li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs text-surface-600">
                  <li>Open <strong>Telefoon</strong>-app → <strong>Instellingen</strong> → <strong>Doorschakelen</strong></li>
                  <li>Tik op <strong>Bij geen gehoor</strong> → vul het nummer in</li>
                  <li>Herhaal voor <strong>Bij bezet</strong></li>
                </ol>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => handleForwarding(true)} disabled={saving} className="btn-primary flex-1">
              {saving ? "Opslaan..." : "Ik heb het ingesteld"}
            </button>
            <button onClick={() => handleForwarding(false)} disabled={saving} className="btn-secondary flex-1">
              Later doen
            </button>
          </div>
        </div>
      )}

      {/* Step: Calendar */}
      {currentStep === "calendar" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">
            Koppel je agenda (optioneel)
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            Met een agenda-koppeling plant Clŷniq afspraken automatisch in.
            Zonder koppeling ontvang je leads en plan je zelf.
          </p>

          {business?.calendar_type === "google" ? (
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-brand-700">Google Agenda gekoppeld</span>
            </div>
          ) : (
            <a
              href="/api/auth/google/calendar?from=onboarding"
              className="btn-primary w-full text-center block mb-3"
            >
              Google Agenda koppelen
            </a>
          )}

          <ul className="space-y-2 text-sm text-surface-500 mb-6">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Alleen toegang tot agenda — niet tot e-mail
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Alleen beschikbaarheid + afspraken
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Later los te koppelen
            </li>
          </ul>

          <button
            onClick={handleCalendar}
            disabled={saving}
            className={business?.calendar_type === "google" ? "btn-primary w-full" : "btn-secondary w-full"}
          >
            {saving ? "Opslaan..." : business?.calendar_type === "google" ? "Verder" : "Overslaan"}
          </button>
        </div>
      )}

      {/* Step: Business Hours */}
      {currentStep === "hours" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">
            Wanneer ben je bereikbaar?
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            De AI plant alleen afspraken binnen je werktijden. Klik op een dag om deze aan of uit te zetten.
          </p>

          <BusinessHours value={availableHours} onChange={setAvailableHours} />

          <button
            onClick={handleHours}
            disabled={saving}
            className="btn-primary w-full mt-6"
          >
            {saving ? "Opslaan..." : "Opslaan en verder"}
          </button>
        </div>
      )}

      {/* Step: Appointments */}
      {currentStep === "appointments" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h2 className="text-xl font-bold text-surface-900 mb-4">
            Afspraak-instellingen
          </h2>
          <p className="text-sm text-surface-500 mb-6">
            Stel in hoe lang je afspraken duren en hoeveel afspraken je per dag wilt.
          </p>

          <div className="space-y-5">
            <div>
              <label className="input-label">Duur per afspraak</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[10, 15, 30, 60, 90, 120].map((min) => (
                  <button
                    key={min}
                    onClick={() => setSlotDuration(min)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      slotDuration === min
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:border-surface-300"
                    }`}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">Max. afspraken per dag</label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxPerDay(n)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      maxPerDay === n
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:border-surface-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleAppointments}
            disabled={saving}
            className="btn-primary w-full mt-6"
          >
            {saving ? "Opslaan..." : "Opslaan en verder"}
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {currentStep === "complete" && (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2 text-center">
            Bijna klaar!
          </h2>
          <p className="text-sm text-surface-500 mb-6 text-center">
            Clŷniq is nu actief. Voeg optioneel je reviewlink en logo toe — beide kun je ook later in je instellingen toevoegen.
          </p>

          {/* Logo upload */}
          <div className="mb-5">
            <label className="input-label">Bedrijfslogo (optioneel)</label>
            <p className="text-xs text-surface-400 mb-2">
              Wordt zichtbaar als profielfoto op WhatsApp. JPG, PNG of WebP, max 5 MB.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            {logoFile && (
              <p className="mt-1 text-xs text-brand-600">{logoFile.name} geselecteerd</p>
            )}
          </div>

          {/* Google review link */}
          <div className="mb-5">
            <label className="input-label">Google-reviewlink (optioneel)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://g.page/r/..."
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
            />
            {/* How-to instructions */}
            <button
              type="button"
              onClick={() => setReviewInfoOpen((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${reviewInfoOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Hoe vind ik mijn Google-reviewlink?
            </button>
            {reviewInfoOpen && (
              <div className="mt-2 bg-surface-50 border border-surface-200 rounded-lg p-3 text-xs text-surface-600 space-y-1">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ga naar <strong>Google Maps</strong> en zoek jouw bedrijf op</li>
                  <li>Klik op je bedrijfspagina en scroll naar beneden</li>
                  <li>Klik op <strong>&ldquo;Vragen om reviews&rdquo;</strong> (of &ldquo;Get more reviews&rdquo;)</li>
                  <li>Kopieer de link en plak hem hierboven</li>
                </ol>
                <p className="text-surface-400 mt-1.5">Je kunt dit ook later toevoegen via Instellingen.</p>
              </div>
            )}
          </div>

          <button
            onClick={handleComplete}
            disabled={saving || logoUploading}
            className="btn-primary w-full"
          >
            {saving || logoUploading ? "Even geduld..." : "Naar mijn dashboard"}
          </button>
          <p className="mt-3 text-center text-xs text-surface-400">
            Logo en reviewlink zijn optioneel — je kunt ze altijd later toevoegen.
          </p>
        </div>
      )}
    </div>
  );
}
