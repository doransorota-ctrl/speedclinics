"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─── Global type augmentation ──────────────────────────── */
declare global {
  interface Window {
    dataLayer: unknown[];
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };
    _fbq: Window["fbq"];
  }
}

/* ─── Cookie helpers ────────────────────────────────────── */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

/* ─── Analytics loader ──────────────────────────────────── */
let analyticsLoaded = false;

function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  // ── GA4 + Google Ads ──
  if (gaId && /^G-[A-Z0-9]+$/.test(gaId)) {
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: true });

    if (adsId && /^AW-[A-Z0-9]+$/.test(adsId)) {
      gtag("config", adsId);
    }
  }

  // ── Meta Pixel ──
  if (pixelId && /^[0-9]+$/.test(pixelId)) {
    /* eslint-disable */
    (function (f: any, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function (...args: unknown[]) {
        n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [] as unknown[];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode?.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }
}

/* ─── Component ─────────────────────────────────────────── */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");

    if (consent === "all") {
      // User already accepted — load analytics immediately
      loadAnalytics();
      return;
    }

    if (!consent) {
      // No choice yet — show the banner
      setVisible(true);
    }
    // If consent === "functional", do nothing (no banner, no analytics)
  }, []);

  function accept() {
    setCookie("cookie_consent", "all", 365);
    setVisible(false);
    loadAnalytics();
  }

  function decline() {
    setCookie("cookie_consent", "functional", 365);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-4xl p-4 sm:p-6">
        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-surface-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Text */}
            <div className="text-sm text-surface-600 leading-relaxed sm:max-w-lg">
              <p>
                Wij gebruiken cookies om onze website te verbeteren en het
                effect van onze campagnes te meten. Je kunt kiezen welke
                cookies je accepteert.{" "}
                <Link
                  href="/privacy"
                  className="underline text-brand-600 hover:text-brand-700"
                >
                  Meer info
                </Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 shrink-0">
              <button
                onClick={decline}
                className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition hover:bg-surface-50"
              >
                Alleen noodzakelijk
              </button>
              <button
                onClick={accept}
                className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                Accepteren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
