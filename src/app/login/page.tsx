"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SocialProofPanel } from "@/components/layout/SocialProofPanel";
import { Logo } from "@/components/ui/Logo";

type LoginMethod = "email" | "phone";
type Step = "input" | "otp-sent" | "link-sent";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [method, setMethod] = useState<LoginMethod>("email");
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const isSignup = searchParams.get("signup") === "1";
  const paymentSuccess = searchParams.get("payment") === "success";
  const authError = searchParams.get("error") === "auth";

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/portal/dashboard`
        : "/auth/callback?next=/portal/dashboard";

    const { error: authError } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (authError) {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } else {
      setStep("link-sent");
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await getSupabase().auth.signInWithOtp({
      phone,
    });

    setLoading(false);
    if (authError) {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } else {
      setStep("otp-sent");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await getSupabase().auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    setLoading(false);
    if (authError) {
      setError("Ongeldige code. Probeer het opnieuw.");
    } else {
      window.location.href = "/portal/dashboard";
    }
  };

  return (
    <AuthLayout
      rightPanel={<SocialProofPanel step="auth" />}
      mobileProof={
        <div className="bg-surface-50 rounded-xl p-3 flex items-center gap-3">
          <span className="inline-flex bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">+3 klussen/week</span>
          <p className="text-xs text-surface-600">&#34;Nu krijgen ze meteen een WhatsApp en staan er al afspraken&#34; — Marco V., Loodgieter</p>
        </div>
      }
    >
        <Link href="/" className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1 mb-6">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-surface-900 mb-6">
          Welkom terug
        </h1>

        {/* Status banners */}
        {authError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="font-semibold text-red-800">Inloglink verlopen</p>
            <p className="text-sm text-red-700 mt-1">
              De link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.
            </p>
          </div>
        )}

        {paymentSuccess && (
          <div className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl text-center">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-brand-800">Betaling gelukt!</p>
            <p className="text-sm text-brand-700 mt-1">
              Je ontvangt binnen enkele minuten een e-mail met je inloglink. Check je inbox (en spam-map).
            </p>
          </div>
        )}

        {isSignup && !paymentSuccess && (
          <div className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl text-center">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-brand-800">Account aangemaakt!</p>
            <p className="text-sm text-brand-700 mt-1">
              We sturen je een inloglink per e-mail. Check je inbox (en spam-map) en klik op de link om in te loggen.
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-xl border border-surface-200 p-6 sm:p-8">
          {/* Link sent confirmation */}
          {step === "link-sent" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-surface-900 font-medium">Check je inbox!</p>
              <p className="text-sm text-surface-500 mt-2">
                We hebben een inloglink gestuurd naar <strong>{email}</strong>.
              </p>
              <button
                onClick={() => { setStep("input"); setError(""); }}
                className="mt-4 text-sm text-brand-600 hover:text-brand-700"
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {/* OTP verification */}
          {step === "otp-sent" && (
            <form onSubmit={handleVerifyOtp} className="text-center">
              <p className="text-sm text-surface-600 mb-4">
                Voer de code in die je per SMS hebt ontvangen op <strong>{phone}</strong>.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field text-center text-lg tracking-widest mb-4"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn-primary w-full"
              >
                {loading ? "Verifiëren..." : "Verifieer"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("input"); setOtp(""); setError(""); }}
                className="mt-3 text-sm text-brand-600 hover:text-brand-700 w-full text-center"
              >
                Terug
              </button>
            </form>
          )}

          {/* Main login form */}
          {step === "input" && (
            <>
              {/* Google login — large and prominent */}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  const redirectTo =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/auth/callback?next=/portal/dashboard`
                      : "/auth/callback?next=/portal/dashboard";
                  const { error: authErr } = await getSupabase().auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo },
                  });
                  if (authErr) {
                    setError("Google login mislukt. Probeer het opnieuw.");
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-surface-300 bg-white hover:bg-surface-50 shadow-sm hover:shadow-md transition-all text-surface-700 font-semibold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Doorgaan met Google
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-surface-400">
                    {method === "email" ? "of log in met e-mail" : "of log in met SMS"}
                  </span>
                </div>
              </div>

              {/* Email login */}
              {method === "email" && (
                <form onSubmit={handleEmailLogin}>
                  <label className="input-label">E-mailadres</label>
                  <input
                    type="email"
                    placeholder="jan@jansen.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field mb-4"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "Bezig..." : "Stuur inloglink"}
                  </button>
                </form>
              )}

              {/* Phone login */}
              {method === "phone" && (
                <form onSubmit={handlePhoneLogin}>
                  <label className="input-label">Telefoonnummer</label>
                  <input
                    type="tel"
                    placeholder="+31 6 12345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field mb-4"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "Bezig..." : "Stuur SMS-code"}
                  </button>
                </form>
              )}

              {/* Method toggle — subtle text link */}
              <div className="mt-5 pt-4 border-t border-surface-100 text-center">
                <button
                  onClick={() => {
                    setMethod(method === "email" ? "phone" : "email");
                    setError("");
                  }}
                  className="text-sm text-surface-400 hover:text-surface-600 cursor-pointer"
                >
                  {method === "email"
                    ? "Liever inloggen via SMS?"
                    : "Inloggen via e-mail"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-surface-500">
          Nog geen account?{" "}
          <Link href="/aanmelden" className="text-brand-600 hover:text-brand-700 font-semibold">
            Aanmelden
          </Link>
        </p>
    </AuthLayout>
  );
}
