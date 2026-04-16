"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { SocialProofPanel } from "@/components/layout/SocialProofPanel";
import { OtpInput } from "@/components/ui/OtpInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { nl } from "@/content/nl";
import Cal, { getCalApi } from "@calcom/embed-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";

type ProfileStep = "identity" | "phone" | "package" | "demo";

const CHECK_ICON = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const FEATURE_CHECK = (
  <svg className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

export default function ProfilePage() {
  const { signup } = nl;
  const [step, setStep] = useState<ProfileStep>("identity");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  // New state
  const [fullName, setFullName] = useState("");
  const [challenge, setChallenge] = useState("");

  // Demo booking
  const [demoBooked, setDemoBooked] = useState(false);

  // Phone verification
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Form data
  const [data, setData] = useState({
    businessName: "",
    phone: "",
    trade: "",
    customTrade: "",
    employees: "",
    addressLine1: "",
    postalCode: "",
    city: "",
    country: "NL",
    plan: "speed-leads" as string,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        window.location.href = "/aanmelden";
        return;
      }

      // If user already has a business, skip signup and go to dashboard
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", u.id)
        .maybeSingle();
      if (existing) {
        window.location.href = "/portal/dashboard";
        return;
      }

      const name = u.user_metadata?.full_name || u.user_metadata?.first_name || "";
      setUser({
        id: u.id,
        email: u.email || "",
        name,
      });
      setFullName(name);
      setLoading(false);

      // Restore form data from sessionStorage
      try {
        const saved = sessionStorage.getItem("signup-form");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.data) setData(parsed.data);
          if (parsed.step) setStep(parsed.step);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.challenge) setChallenge(parsed.challenge);
          if (parsed.phoneVerified) setPhoneVerified(true);
        }
      } catch {}
    });
  }, []);

  // Cal.com embed init + booking listener
  useEffect(() => {
    if (step === "demo") {
      (async () => {
        const cal = await getCalApi();
        cal("ui", { theme: "light", styles: { branding: { brandColor: "#6366f1" } } });
        cal("on", {
          action: "bookingSuccessfulV2",
          callback: () => setDemoBooked(true),
        });
      })();
    }
  }, [step]);

  const update = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  // ─── Phone OTP ───
  const handleSendOtp = async () => {
    const phoneVal = data.phone.trim();
    if (!phoneVal || !/^\+?[0-9\s\-()]{8,20}$/.test(phoneVal)) {
      setOtpError("Vul een geldig telefoonnummer in.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneVal, action: "send" }),
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        setOtpSent(true);
        setData((prev) => ({ ...prev, phone: result.phone }));
      } else {
        setOtpError(result.error || "Kon geen SMS versturen. Controleer je nummer.");
      }
    } catch {
      setOtpError("Netwerkfout. Probeer het opnieuw.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (phoneOtp.length < 6) return;
    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone, code: phoneOtp, action: "verify" }),
      });
      const result = await res.json();
      if (res.ok && result.verified) {
        setPhoneVerified(true);
        setOtpError("");
        try {
          sessionStorage.setItem("signup-form", JSON.stringify({ data, step: "phone", fullName, challenge, phoneVerified: true }));
        } catch {}
        // Auto-advance after 1 second
        setTimeout(() => setStep("package"), 1000);
      } else {
        setOtpError(result.error || "Ongeldige code. Probeer het opnieuw.");
      }
    } catch {
      setOtpError("Netwerkfout. Probeer het opnieuw.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Step validation ───
  const validateStep = (s: ProfileStep): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === "identity") {
      if (!data.businessName.trim()) newErrors.businessName = signup.fields.businessName.error;
      if (!data.trade) newErrors.trade = signup.fields.trade.error;
      if (data.trade === "anders" && !data.customTrade.trim()) newErrors.trade = "Vul je vakgebied in";
      if (!data.employees) newErrors.employees = "Selecteer het aantal medewerkers";
    } else if (s === "phone") {
      if (!phoneVerified) newErrors.phone = "Verifieer je telefoonnummer om verder te gaan.";
    } else if (s === "package") {
      if (!data.addressLine1.trim()) newErrors.addressLine1 = "Vul je straat en huisnummer in";
      if (!data.postalCode.trim()) newErrors.postalCode = "Vul je postcode in";
      if (!data.city.trim()) newErrors.city = "Vul je plaats in";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const steps: ProfileStep[] = ["identity", "phone", "package"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
      // Save to sessionStorage
      try {
        sessionStorage.setItem("signup-form", JSON.stringify({ data, step: steps[idx + 1], fullName, challenge, phoneVerified }));
      } catch {}
    }
  };

  const goBack = () => {
    const steps: ProfileStep[] = ["identity", "phone", "package"];
    const idx = steps.indexOf(step);
    if (idx > 0) { setStep(steps[idx - 1]); setErrors({}); }
  };

  // ─── Submit ───
  const handleSubmit = async (plan: string) => {
    if (!user) return;

    // For website/compleet, go to demo step first
    if ((plan === "website" || plan === "compleet") && step !== "demo") {
      setData((prev) => ({ ...prev, plan }));
      setStep("demo");
      return;
    }

    // For speed-leads on package step, validate address
    if (step === "package" && !validateStep("package")) return;

    setSubmitting(true);
    setData((prev) => ({ ...prev, plan }));
    try {
      const res = await fetch("/api/signup/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          trade: data.trade === "anders" ? data.customTrade.trim() : data.trade,
          plan,
          fullName,
          challenge,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.checkoutUrl) {
          try { sessionStorage.removeItem("signup-form"); } catch {}
          window.location.href = result.data.checkoutUrl;
        } else {
          try { sessionStorage.removeItem("signup-form"); } catch {}
          window.location.href = "/portal/dashboard";
        }
      } else {
        const body = await res.json();
        setErrors({ form: body.error || "Er ging iets mis. Probeer het opnieuw." });
        setStep("package");
      }
    } catch {
      setErrors({ form: "Netwerkfout. Controleer je verbinding en probeer opnieuw." });
      setStep("package");
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "daar";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-pulse text-surface-400">Laden...</div>
      </div>
    );
  }

  // ═══ Step 1: Identity ═══
  if (step === "identity") {
    return (
      <AuthLayout rightPanel={<SocialProofPanel step="identity" />} progressPercent={25}>
        <p className="text-xs text-surface-400 uppercase tracking-wide mb-2">STAP 1 VAN 4</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-medium mb-4">
          Bijna klaar — nog 3 stappen
        </span>
        <h1 className="text-2xl font-bold text-surface-900">Welkom, {firstName}!</h1>
        <p className="text-surface-500 mb-6">Vertel ons over je bedrijf</p>

        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <div className="space-y-5">
            {/* Volledige naam */}
            <div>
              <label className="input-label">Volledige naam</label>
              <input
                type="text"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {/* Bedrijfsnaam */}
            <div>
              <label className="input-label">{signup.fields.businessName.label}</label>
              <input
                type="text"
                className={`input-field ${errors.businessName ? "!border-red-400" : ""}`}
                placeholder={signup.fields.businessName.placeholder}
                value={data.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                autoComplete="organization"
              />
              {errors.businessName && <p className="input-error">{errors.businessName}</p>}
            </div>

            {/* Vakgebied */}
            <div>
              <label className="input-label">{signup.fields.trade.label}</label>
              <select
                className={`input-field appearance-none ${errors.trade ? "!border-red-400" : ""} ${!data.trade ? "text-surface-400" : ""}`}
                value={data.trade}
                onChange={(e) => update("trade", e.target.value)}
              >
                <option value="">{signup.fields.trade.placeholder}</option>
                {signup.fields.trade.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {data.trade === "anders" && (
                <input
                  type="text"
                  className="input-field mt-2"
                  placeholder="Vul je vakgebied in"
                  value={data.customTrade || ""}
                  onChange={(e) => update("customTrade", e.target.value)}
                />
              )}
              {errors.trade && <p className="input-error">{errors.trade}</p>}
            </div>

            {/* Aantal medewerkers */}
            <div>
              <label className="input-label">{signup.fields.employees.label}</label>
              <div className="grid grid-cols-3 gap-3">
                {signup.fields.employees.options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => update("employees", o.value)}
                    className={`relative px-3 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                      data.employees === o.value
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20"
                        : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                    }`}
                  >
                    {data.employees === o.value && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-white">
                        {CHECK_ICON}
                      </div>
                    )}
                    {o.label}
                  </button>
                ))}
              </div>
              {errors.employees && <p className="input-error">{errors.employees}</p>}
            </div>

            {/* JTBD question */}
            <div>
              <label className="input-label">Wat is je grootste uitdaging?</label>
              <div className="space-y-2">
                {nl.signupFlow.jtbd.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setChallenge(option)}
                    className={`p-3.5 rounded-xl border text-sm text-left w-full transition-all ${
                      challenge === option
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={goNext} className="btn-primary w-full mt-6">Volgende</button>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/aanmelden";
            }}
            className="w-full mt-3 text-sm text-surface-400 hover:text-surface-600 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ═══ Step 2: Phone ═══
  if (step === "phone") {
    return (
      <AuthLayout rightPanel={<SocialProofPanel step="phone" />} progressPercent={50}>
        <p className="text-xs text-surface-400 uppercase tracking-wide mb-2">STAP 2 VAN 4</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-4">
          Laatste stap voor je proefperiode
        </span>
        <h1 className="text-2xl font-bold text-surface-900">Verifieer je telefoonnummer</h1>
        <p className="text-surface-500 mb-6">Dit wordt het nummer dat je klanten bellen. We sturen een SMS-code.</p>

        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <div className="space-y-4">
            {/* Phone input */}
            <div>
              <label className="input-label">{signup.fields.phone.label}</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  className={`input-field flex-1 ${errors.phone ? "!border-red-400" : ""}`}
                  placeholder="+31 6 12345678"
                  value={data.phone}
                  onChange={(e) => {
                    update("phone", e.target.value);
                    setPhoneVerified(false);
                    setOtpSent(false);
                    setPhoneOtp("");
                  }}
                  disabled={phoneVerified}
                  autoFocus
                  autoComplete="tel"
                />
                {!phoneVerified && !otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="px-4 py-2.5 rounded-lg border border-brand-500 bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {otpLoading ? "Versturen..." : "Stuur code"}
                  </button>
                )}
                {phoneVerified && (
                  <div className="flex items-center gap-1.5 px-3 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Geverifieerd</span>
                  </div>
                )}
              </div>
            </div>

            {/* OTP input */}
            {otpSent && !phoneVerified && (
              <div>
                <label className="input-label">Verificatiecode</label>
                <OtpInput value={phoneOtp} onChange={setPhoneOtp} />
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || phoneOtp.length < 6}
                    className="btn-primary px-5 text-sm disabled:opacity-60"
                  >
                    {otpLoading ? "..." : "Verifieer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setPhoneOtp(""); setOtpError(""); }}
                    className="text-xs text-surface-400 hover:text-surface-600"
                  >
                    Ander nummer
                  </button>
                </div>
              </div>
            )}

            {otpError && <p className="input-error">{otpError}</p>}
            {errors.phone && <p className="input-error">{errors.phone}</p>}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button onClick={goBack} className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug
            </button>
            <button onClick={goNext} disabled={!phoneVerified} className="btn-primary flex-1 disabled:opacity-40">Volgende</button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ═══ Step 3: Package ═══
  if (step === "package") {
    return (
      <>
        <ProgressBar percent={75} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-xs text-surface-400 uppercase tracking-wide mb-2">STAP 3 VAN 4</p>
          <h1 className="text-2xl font-bold text-surface-900 mb-4">Kies je pakket</h1>

          {/* Factuuradres — must be filled before selecting a package */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Factuuradres</h3>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  className={`input-field-compact ${errors.addressLine1 ? "!border-red-400" : ""}`}
                  placeholder="Straat en huisnummer"
                  value={data.addressLine1}
                  onChange={(e) => update("addressLine1", e.target.value)}
                  autoComplete="street-address"
                />
                {errors.addressLine1 && <p className="input-error">{errors.addressLine1}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    className={`input-field-compact ${errors.postalCode ? "!border-red-400" : ""}`}
                    placeholder="Postcode"
                    value={data.postalCode}
                    onChange={(e) => update("postalCode", e.target.value.toUpperCase())}
                    autoComplete="postal-code"
                  />
                  {errors.postalCode && <p className="input-error">{errors.postalCode}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    className={`input-field-compact ${errors.city ? "!border-red-400" : ""}`}
                    placeholder="Plaats"
                    value={data.city}
                    onChange={(e) => update("city", e.target.value)}
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="input-error">{errors.city}</p>}
                </div>
              </div>
              <div className="w-1/2">
                <select
                  className="input-field-compact appearance-none"
                  value={data.country}
                  onChange={(e) => update("country", e.target.value)}
                  autoComplete="country"
                >
                  <option value="NL">Nederland</option>
                  <option value="BE">Belgi&euml;</option>
                  <option value="DE">Duitsland</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anchoring banner */}
          <div className="bg-surface-900 text-white rounded-xl p-4 mb-6 text-center text-sm">
            Elke gemiste oproep is een potenti&euml;le klant die de concurrent belt. Speed Leads vangt ze automatisch op — vanaf <strong>&euro;79/maand</strong>.
          </div>

          {!(data.addressLine1.trim() && data.postalCode.trim() && data.city.trim()) && (
            <p className="text-xs text-amber-600 text-center mb-4">Vul je factuuradres in om een pakket te kiezen.</p>
          )}

          {/* Package cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Website */}
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
                onClick={() => handleSubmit("website")}
                disabled={submitting || !(data.addressLine1.trim() && data.postalCode.trim() && data.city.trim())}
                className="w-full mt-5 py-2.5 rounded-xl border-2 border-surface-300 text-surface-700 font-semibold hover:border-surface-400 hover:bg-surface-50 transition-colors disabled:opacity-40"
              >
                Plan een demo
              </button>
            </div>

            {/* Speed Leads — center position */}
            <div className="relative bg-white rounded-2xl border-2 border-brand-500 shadow-lg p-6 flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Populair
              </span>
              <h3 className="text-lg font-bold text-surface-900 mt-2">Speed Leads</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-surface-900">&euro;79</span>
                <span className="text-surface-500">/maand</span>
              </div>
              <p className="text-xs text-surface-400 mt-0.5">excl. BTW &middot; 14 dagen gratis</p>
              <ul className="mt-4 space-y-2 flex-1">
                {["Gemiste oproepen \u2192 WhatsApp", "AI plant afspraken in", "Google Agenda-koppeling", "Herinneringen voor klanten", "Automatische review-verzoeken"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                    {FEATURE_CHECK}
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubmit("speed-leads")}
                disabled={submitting || !(data.addressLine1.trim() && data.postalCode.trim() && data.city.trim())}
                className="btn-primary w-full mt-5 disabled:opacity-40"
              >
                {submitting && data.plan === "speed-leads" ? "Bezig..." : "Start gratis proefperiode"}
              </button>
            </div>

            {/* Compleet */}
            <div className="relative bg-white rounded-2xl border border-surface-200 p-6 flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                Beste waarde
              </span>
              <h3 className="text-lg font-bold text-surface-900 mt-2">Compleet Pakket</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-surface-900">&euro;500</span>
                <span className="text-surface-500"> + &euro;118/m</span>
              </div>
              <p className="text-xs text-surface-400 mt-0.5">excl. BTW &middot; 14 dagen gratis (Speed Leads)</p>
              <ul className="mt-4 space-y-2 flex-1">
                {["Alles van Speed Leads", "Alles van Website Pakket", "Website + leadopvolging in \u00e9\u00e9n", "E\u00e9n factuur, geen gedoe"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                    {FEATURE_CHECK}
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubmit("compleet")}
                disabled={submitting || !(data.addressLine1.trim() && data.postalCode.trim() && data.city.trim())}
                className="w-full mt-5 py-2.5 rounded-xl border-2 border-surface-300 text-surface-700 font-semibold hover:border-surface-400 hover:bg-surface-50 transition-colors disabled:opacity-40"
              >
                Plan een demo
              </button>
            </div>
          </div>

          {/* Consent */}
          <p className="text-xs text-surface-400 text-center mt-4">
            Door te starten ga je akkoord met ons{" "}
            <Link href="/privacy" className="text-brand-600 hover:text-brand-700 underline">privacybeleid</Link>{" "}
            en{" "}
            <Link href="/voorwaarden" className="text-brand-600 hover:text-brand-700 underline">voorwaarden</Link>.
          </p>

          {/* Errors */}
          {errors.form && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
              {errors.form}
            </div>
          )}

          {/* Back button */}
          <div className="flex justify-center mt-4">
            <button onClick={goBack} className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug
            </button>
          </div>
        </div>
      </>
    );
  }

  // ═══ Step 4: Demo (website/compleet only) ═══
  if (step === "demo") {
    return (
      <>
        <ProgressBar percent={90} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-xs text-surface-400 uppercase tracking-wide mb-2">STAP 4 VAN 4</p>
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
            <button onClick={() => setStep("package")} className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Terug
            </button>
            <button onClick={() => handleSubmit(data.plan)} disabled={submitting || !demoBooked} className="btn-primary flex-1 disabled:opacity-40">
              {submitting ? "Bezig..." : demoBooked ? "Doorgaan naar betaling" : "Plan eerst een demo"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
