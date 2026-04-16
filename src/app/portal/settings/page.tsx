"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { BusinessHours, DEFAULT_HOURS, type WeekHours } from "@/components/BusinessHours";
import { PhoneInput } from "@/components/PhoneInput";

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-6 h-64" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { business, loading, refetch } = useBusiness();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Editable profile fields
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");

  // Business hours + appointment settings
  const [availableHours, setAvailableHours] = useState<WeekHours>(DEFAULT_HOURS);
  const [slotDuration, setSlotDuration] = useState(120);
  const [maxPerDay, setMaxPerDay] = useState(4);
  const [savingHours, setSavingHours] = useState(false);

  // Google Reviews
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // WhatsApp logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Shared voice number (fetched from authenticated settings API)
  const [voiceNumber, setVoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/settings")
      .then((res) => res.json())
      .then((data) => setVoiceNumber(data.twilio_number ?? data.voiceNumber ?? null))
      .catch(() => {});
  }, []);

  // Handle calendar callback query params
  useEffect(() => {
    const calendar = searchParams.get("calendar");
    if (calendar === "connected") {
      setSuccess("Google Agenda succesvol gekoppeld!");
      refetch();
      setTimeout(() => setSuccess(""), 5000);
    } else if (calendar === "denied") {
      setError("Je hebt de koppeling met Google Agenda geweigerd.");
      setTimeout(() => setError(""), 5000);
    } else if (calendar === "expired" || calendar === "error") {
      setError("Er ging iets mis bij het koppelen. Probeer het opnieuw.");
      setTimeout(() => setError(""), 5000);
    }
  }, [searchParams, refetch]);

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setTrade(business.trade || "");
      setServiceArea(business.service_area || "");
      setPhone(business.phone || "");
      if (business.available_hours) {
        setAvailableHours(business.available_hours as WeekHours);
      }
      setSlotDuration(business.slot_duration_minutes ?? 120);
      setMaxPerDay(business.max_appointments_per_day ?? 4);
      setGoogleReviewLink(business.google_review_link || "");
    }
  }, [business]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccess("");
    try {
      const res = await fetch("/api/portal/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, trade, service_area: serviceArea, phone }),
      });
      if (res.ok) {
        setSuccess("Profiel opgeslagen");
        refetch();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-surface-200 p-6 h-64" />
        <div className="bg-white rounded-xl border border-surface-200 p-6 h-32" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900">Instellingen</h1>
      <p className="text-surface-500 mt-1">Beheer je account en integraties.</p>

      {/* Success toast */}
      {success && (
        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-brand-700">{success}</p>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Profile form */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Bedrijfsprofiel</h2>
            <p className="text-xs text-surface-500 mt-0.5">Deze gegevens worden gebruikt in gesprekken met klanten.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Bedrijfsnaam</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Vakgebied</label>
                <input
                  type="text"
                  className="input-field"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Werkgebied</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Bijv. Amsterdam en omstreken"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Telefoonnummer</label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>
            </div>
            <div>
              <label className="input-label">E-mailadres</label>
              <input
                type="email"
                className="input-field bg-surface-50 text-surface-500"
                value={business?.email || ""}
                disabled
              />
              <p className="text-xs text-surface-400 mt-1">E-mailadres kan niet worden gewijzigd.</p>
            </div>
          </div>
          <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary text-sm px-5 py-2.5"
            >
              {saving ? "Opslaan..." : "Wijzigingen opslaan"}
            </button>
          </div>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-surface-900">Abonnement</h2>
                <p className="text-xs text-surface-400">
                  {business?.status === "trialing" ? "Proefperiode" : business?.status === "active" ? "Actief" : business?.status === "past_due" ? "Achterstallig" : "Inactief"}
                  {business?.plan ? ` — ${business.plan}` : ""}
                </p>
              </div>
            </div>
            <Link href="/portal/billing" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Beheer →
            </Link>
          </div>
        </div>

        {/* Business hours */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Werktijden</h2>
            <p className="text-xs text-surface-500 mt-0.5">De AI plant alleen afspraken binnen deze tijden.</p>
          </div>
          <div className="p-6 space-y-6">
            <BusinessHours value={availableHours} onChange={setAvailableHours} />

            <div className="border-t border-surface-100 pt-5">
              <h3 className="text-sm font-medium text-surface-700 mb-3">Afspraak instellingen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Duur per afspraak</label>
                  <select
                    className="input-field"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                  >
                    <option value={10}>10 minuten</option>
                    <option value={15}>15 minuten</option>
                    <option value={30}>30 minuten</option>
                    <option value={60}>1 uur</option>
                    <option value={90}>1,5 uur</option>
                    <option value={120}>2 uur</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Max afspraken per dag</label>
                  <select
                    className="input-field"
                    value={maxPerDay}
                    onChange={(e) => setMaxPerDay(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex justify-end">
            <button
              onClick={async () => {
                setSavingHours(true);
                setSuccess("");
                try {
                  const res = await fetch("/api/portal/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      available_hours: availableHours,
                      slot_duration_minutes: slotDuration,
                      max_appointments_per_day: maxPerDay,
                    }),
                  });
                  if (res.ok) {
                    setSuccess("Werktijden opgeslagen");
                    refetch();
                    setTimeout(() => setSuccess(""), 3000);
                  }
                } catch {
                  // ignore
                } finally {
                  setSavingHours(false);
                }
              }}
              disabled={savingHours}
              className="btn-primary text-sm px-5 py-2.5"
            >
              {savingHours ? "Opslaan..." : "Werktijden opslaan"}
            </button>
          </div>
        </div>

        {/* Forwarding */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Doorschakelen</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                business?.forwarding_confirmed ? "bg-brand-50" : "bg-surface-100"
              }`}>
                <svg className={`w-5 h-5 ${business?.forwarding_confirmed ? "text-brand-600" : "text-surface-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">
                    {business?.forwarding_confirmed ? "Doorschakelen ingesteld" : "Doorschakelen niet ingesteld"}
                  </p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    business?.forwarding_confirmed
                      ? "bg-brand-50 text-brand-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {business?.forwarding_confirmed ? "Actief" : "Actie nodig"}
                  </span>
                </div>
                {voiceNumber && (
                  <p className="text-sm text-surface-500 mt-1">
                    Doorschakelnummer: <span className="font-mono font-medium">{voiceNumber}</span>
                  </p>
                )}
                {!business?.forwarding_confirmed && (
                  <Link href="/portal/onboarding" className="inline-block mt-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                    Doorschakelen instellen →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Agenda</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                business?.calendar_type ? "bg-brand-50" : "bg-surface-100"
              }`}>
                <svg className={`w-5 h-5 ${business?.calendar_type ? "text-brand-600" : "text-surface-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                {business?.calendar_type === "google" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-900">Google Agenda gekoppeld</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                        Verbonden
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-1">
                      Afspraken worden automatisch in je Google Agenda geplaatst.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/portal/settings/calendar/disconnect", { method: "POST" });
                          if (res.ok) {
                            setSuccess("Google Agenda ontkoppeld");
                            refetch();
                            setTimeout(() => setSuccess(""), 3000);
                          }
                        } catch {}
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Ontkoppelen
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-surface-900">Geen agenda gekoppeld</p>
                    <p className="text-sm text-surface-500 mt-1">
                      Koppel je Google Agenda zodat afspraken automatisch worden ingepland.
                    </p>
                    <a
                      href="/api/auth/google/calendar"
                      className="inline-block mt-3 btn-primary text-sm px-4 py-2.5"
                    >
                      Google Agenda koppelen
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Google Reviews */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h2 className="text-lg font-semibold text-surface-900">Google Reviews</h2>
          <p className="text-sm text-surface-500 mt-0.5 mb-3">
            Klanten ontvangen automatisch een review-verzoek na hun afspraak.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="url"
              className="input-field flex-1 !mb-0"
              placeholder="https://g.page/r/..."
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
            />
            <button
              onClick={async () => {
                setSavingReview(true);
                setSuccess("");
                try {
                  const res = await fetch("/api/portal/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ google_review_link: googleReviewLink }),
                  });
                  if (res.ok) {
                    setSuccess("Google Review link opgeslagen");
                    refetch();
                    setTimeout(() => setSuccess(""), 3000);
                  }
                } catch {
                  // ignore
                } finally {
                  setSavingReview(false);
                }
              }}
              disabled={savingReview}
              className="btn-primary text-sm px-4 py-2 flex-shrink-0"
            >
              {savingReview ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
          <p className="text-xs text-surface-400 mt-1.5">
            Google Maps → zoek je bedrijf → &quot;Vraag om reviews&quot; → kopieer de link
          </p>
        </div>

        {/* WhatsApp profiel */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">WhatsApp-profiel</h2>
              <p className="text-sm text-surface-500 mt-0.5">
                {business?.whatsapp_profile_picture_handle
                  ? "Logo is ingesteld op WhatsApp."
                  : "Upload een logo als profielfoto voor je WhatsApp-nummer."}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-surface-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
            {logoFile && (
              <button
                onClick={async () => {
                  if (!logoFile) return;
                  setLogoUploading(true);
                  setSuccess("");
                  try {
                    const formData = new FormData();
                    formData.append("file", logoFile);
                    const res = await fetch("/api/portal/upload/profile-picture", {
                      method: "POST",
                      body: formData,
                    });
                    if (res.ok) {
                      setSuccess("Logo opgeslagen");
                      setLogoFile(null);
                      refetch();
                      setTimeout(() => setSuccess(""), 3000);
                    }
                  } catch {
                    // ignore
                  } finally {
                    setLogoUploading(false);
                  }
                }}
                disabled={logoUploading}
                className="btn-primary text-sm px-4 py-2 w-full"
              >
                {logoUploading ? "Uploaden..." : "Logo opslaan"}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
