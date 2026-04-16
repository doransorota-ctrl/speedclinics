"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function MidPageCTA() {
  const { midCta } = nl;

  return (
    <div className="px-6 sm:px-8 lg:px-12 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xl sm:text-2xl font-bold text-surface-900 leading-snug">
          {midCta.headline}
        </p>
        <Link
          href="/demo"
          onClick={() => events.ctaClick("mid-page", "primary")}
          className="btn-primary mt-6 inline-flex"
        >
          {midCta.cta}
        </Link>
        <p className="mt-2 text-xs text-surface-400">
          {midCta.ctaMicro}
        </p>
        <p className="mt-3 text-sm text-surface-400">
          {midCta.trust}
        </p>
      </div>
    </div>
  );
}
