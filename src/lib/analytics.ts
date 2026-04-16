/**
 * Speed Clinics — Analytics & Tracking
 *
 * Event naming convention: snake_case
 * Format: {category}_{action}_{target}
 *
 * Categories: page, cta, form, scroll, faq, demo
 *
 * Integration points:
 * - GA4 (gtag)
 * - Meta Pixel (fbq)
 * - Google Ads (gtag conversion)
 */

// ─── Types ──────────────────────────────────────────────
type EventParams = Record<string, string | number | boolean | undefined>;

interface AnalyticsConfig {
  gaId?: string;
  metaPixelId?: string;
  googleAdsId?: string;
  googleAdsConversionLabel?: string;
}

// ─── Config ─────────────────────────────────────────────
const config: AnalyticsConfig = {
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  googleAdsConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL,
};

// ─── Helpers ────────────────────────────────────────────
function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq(...args);
  }
}

// ─── Core tracking function ─────────────────────────────
export function trackEvent(eventName: string, params?: EventParams) {
  // GA4
  gtag("event", eventName, params);

  // Console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, params);
  }
}

// ─── Event Map ──────────────────────────────────────────
// See docs/tracking-event-map.md for full documentation

export const events = {
  // Page events
  pageView: (page: string) =>
    trackEvent("page_view", { page_title: page }),

  // CTA clicks
  ctaClick: (location: string, variant: string) =>
    trackEvent("cta_click", { cta_location: location, cta_variant: variant }),

  heroCta: () => trackEvent("cta_click_hero"),
  stickyCta: () => trackEvent("cta_click_sticky"),
  pricingCta: (plan: string) =>
    trackEvent("cta_click_pricing", { plan }),
  finalCta: () => trackEvent("cta_click_final"),
  demoCta: (location: string) =>
    trackEvent("cta_click_demo", { location }),
  whatsappCta: () => trackEvent("cta_click_whatsapp"),

  // Form events
  formStart: (formType: "trial" | "demo") =>
    trackEvent("form_start", { form_type: formType }),
  formFieldFocus: (formType: string, field: string) =>
    trackEvent("form_field_focus", { form_type: formType, field }),
  formSubmit: (formType: "trial" | "demo") =>
    trackEvent("form_submit", { form_type: formType }),
  formSuccess: (formType: "trial" | "demo") => {
    trackEvent("form_success", { form_type: formType });

    // Meta Pixel — Lead event
    fbq("track", "Lead", { content_name: formType });

    // Google Ads conversion
    if (formType === "trial" && config.googleAdsId && config.googleAdsConversionLabel) {
      gtag("event", "conversion", {
        send_to: `${config.googleAdsId}/${config.googleAdsConversionLabel}`,
      });
    }
  },
  formError: (formType: string, error: string) =>
    trackEvent("form_error", { form_type: formType, error }),

  // Scroll depth
  scrollDepth: (percentage: 25 | 50 | 75 | 100) =>
    trackEvent("scroll_depth", { percentage }),

  // FAQ
  faqExpand: (question: string) =>
    trackEvent("faq_expand", { question }),

  // Calculator
  calculatorFormOpen: () =>
    trackEvent("calculator_form_open"),
  calculatorFormSubmit: (lossYearly: number) =>
    trackEvent("calculator_form_submit", { loss_yearly: lossYearly }),

  // Demo
  demoBookingSuccess: () => {
    trackEvent("demo_booking_success");
    fbq("track", "Schedule");
  },
} as const;

// ─── Scroll depth tracker ───────────────────────────────
export function initScrollTracking() {
  if (typeof window === "undefined") return;

  const thresholds = [25, 50, 75, 100] as const;
  const fired = new Set<number>();

  function checkScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

    for (const threshold of thresholds) {
      if (scrollPercent >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        events.scrollDepth(threshold);
      }
    }
  }

  window.addEventListener("scroll", checkScroll, { passive: true });
  return () => window.removeEventListener("scroll", checkScroll);
}

// ─── GA4 + Meta Pixel initialization scripts ────────────
export function getAnalyticsScripts(): string {
  const scripts: string[] = [];

  if (config.gaId) {
    scripts.push(`
      <script async src="https://www.googletagmanager.com/gtag/js?id=${config.gaId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.gaId}', { send_page_view: false });
        ${config.googleAdsId ? `gtag('config', '${config.googleAdsId}');` : ""}
      </script>
    `);
  }

  if (config.metaPixelId) {
    scripts.push(`
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${config.metaPixelId}');
        fbq('track', 'PageView');
      </script>
    `);
  }

  return scripts.join("\n");
}
