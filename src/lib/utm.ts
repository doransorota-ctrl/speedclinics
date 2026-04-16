/**
 * clŷniq — UTM Parameter Capture & Storage
 *
 * Captures UTM parameters from URL on first visit,
 * stores in sessionStorage, and attaches to form submissions.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "gclid",
  "fbclid",
] as const;

type UTMKey = (typeof UTM_KEYS)[number];
type UTMData = Partial<Record<UTMKey, string>>;

const STORAGE_KEY = "sl_utm";

/** Capture UTM params from current URL and store them */
export function captureUTM(): UTMData {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: UTMData = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }

  // Only store if we found new params; don't overwrite existing
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // sessionStorage not available
    }
  }

  return utm;
}

/** Get stored UTM params */
export function getUTM(): UTMData {
  if (typeof window === "undefined") return {};

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/** Get landing page URL */
export function getLandingPage(): string {
  if (typeof window === "undefined") return "";

  const key = "sl_landing";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const url = window.location.href;
    sessionStorage.setItem(key, url);
    return url;
  } catch {
    return window.location.href;
  }
}

/** Get referrer */
export function getReferrer(): string {
  if (typeof window === "undefined") return "";

  const key = "sl_referrer";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;

    const ref = document.referrer || "direct";
    sessionStorage.setItem(key, ref);
    return ref;
  } catch {
    return document.referrer || "direct";
  }
}

/** Get all tracking data for form submission */
export function getTrackingData() {
  return {
    ...getUTM(),
    landing_page: getLandingPage(),
    referrer: getReferrer(),
    timestamp: new Date().toISOString(),
  };
}
