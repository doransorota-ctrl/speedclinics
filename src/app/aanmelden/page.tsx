"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SocialProofPanel } from "@/components/layout/SocialProofPanel";
import { Logo } from "@/components/ui/Logo";

export default function AanmeldenPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState("");

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    const supabase = getSupabase();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/aanmelden/profiel`
        : "/auth/callback?next=/aanmelden/profiel";

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (err) {
      setError("Er ging iets mis. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabase();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/aanmelden/profiel`
        : "/auth/callback?next=/aanmelden/profiel";

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (err) {
      setError("Kon geen e-mail versturen. Controleer je adres.");
    } else {
      setLinkSent(true);
    }
    setLoading(false);
  };

  if (linkSent) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Check je inbox</h1>
          <p className="mt-3 text-surface-600">
            We hebben een link gestuurd naar <strong>{email}</strong>. Klik op de link om je account aan te maken.
          </p>
          <p className="mt-6 text-sm text-surface-400">
            Geen e-mail? Check je spam folder of{" "}
            <button
              onClick={() => setLinkSent(false)}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              probeer opnieuw
            </button>
          </p>
        </div>
      </div>
    );
  }

  const mobileProof = (
    <div className="bg-surface-50 rounded-xl p-3 flex items-center gap-3">
      <span className="inline-flex bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
        +8 consulten/week
      </span>
      <p className="text-sm text-surface-600 leading-snug">
        &ldquo;Patiënten krijgen direct antwoord en consulten staan automatisch in de agenda&rdquo; — Dr. Lisa v.d. Berg
      </p>
    </div>
  );

  return (
    <AuthLayout
      rightPanel={<SocialProofPanel step="auth" />}
      progressPercent={0}
      mobileProof={mobileProof}
    >
      <Link href="/" className="text-sm text-surface-400 hover:text-surface-600 transition-colors inline-flex items-center gap-1 mb-6">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </Link>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Logo size="sm" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
        Start je gratis proefperiode
      </h1>
      <p className="mt-2 text-surface-500">
        14 dagen gratis. Geen creditcard nodig.
      </p>

      {/* Social proof line */}
      <div className="flex items-center gap-2 mt-3 mb-8">
        <span className="w-2 h-2 rounded-full bg-brand-500" />
        <span className="text-sm text-surface-500">Vertrouwd door klinieken in Nederland</span>
      </div>

      {/* Google signup */}
      <button
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-surface-300 bg-white hover:bg-surface-50 text-surface-700 font-medium transition-colors shadow-sm hover:shadow-md transition-shadow disabled:opacity-60"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Aanmelden met Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-surface-200" />
        <span className="text-xs text-surface-400 uppercase">of</span>
        <div className="flex-1 h-px bg-surface-200" />
      </div>

      {/* Email signup */}
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            className="input-field"
            placeholder="info@kliniekesthetique.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Even geduld..." : "Aanmelden met e-mail"}
        </button>
      </form>

      {/* Terms */}
      <p className="mt-6 text-center text-xs text-surface-400">
        Door verder te gaan ga je akkoord met ons{" "}
        <Link href="/privacy" className="text-brand-600 hover:text-brand-700">privacybeleid</Link>{" "}
        en onze{" "}
        <Link href="/voorwaarden" className="text-brand-600 hover:text-brand-700">voorwaarden</Link>.
      </p>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-surface-500">
        Heb je al een account?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
          Inloggen
        </Link>
      </p>
    </AuthLayout>
  );
}
