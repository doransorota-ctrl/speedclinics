"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function FinalCTA() {
  const { finalCta } = nl;

  return (
    <section className="section bg-surface-800">
      <div className="section-inner text-center">
        <h2 className="text-3xl sm:text-4xl font-serif italic text-white">
          {finalCta.headline}
        </h2>
        <p className="mt-4 text-lg text-surface-300 max-w-md mx-auto">
          {finalCta.subheadline}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex flex-col items-center">
            <Link
              href="/demo"
              onClick={() => events.finalCta()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-full text-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/20 w-full sm:w-auto"
            >
              {finalCta.ctaPrimary}
            </Link>
            <p className="mt-2 text-xs text-surface-400">
              {finalCta.ctaPrimaryMicro}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <a
              href="#hoe-het-werkt"
              onClick={() => events.ctaClick("final", "how-it-works")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-lg transition-all duration-200 border border-white/20 w-full sm:w-auto"
            >
              {finalCta.ctaSecondary}
            </a>
            <p className="mt-2 text-xs text-surface-500">
              {finalCta.ctaSecondaryMicro}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-surface-400">{finalCta.trust}</p>
        {"guaranteeLine" in finalCta && finalCta.guaranteeLine && (
          <p className="mt-2 text-sm font-medium text-brand-400">
            {finalCta.guaranteeLine}
          </p>
        )}
      </div>
    </section>
  );
}
