"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function MidPageCTA() {
  const { midCta } = nl;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mx-auto text-center bg-surface-50 border border-surface-200 rounded-xl px-6 py-8">
        <p className="text-lg font-bold text-surface-900">
          {midCta.headline}
        </p>
        <Link
          href="/demo"
          onClick={() => events.ctaClick("mid-page", "primary")}
          className="btn-primary mt-4 inline-flex"
        >
          {midCta.cta}
        </Link>
        <p className="mt-2 text-xs text-surface-500">
          {midCta.ctaMicro}
        </p>
        <p className="mt-2 text-xs text-surface-400">
          {midCta.trust}
        </p>
      </div>
    </div>
  );
}
