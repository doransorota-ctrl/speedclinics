"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

export function WebsitePackage() {
  const { websitePackage } = nl;

  return (
    <section id="website-pakket" className="section bg-surface-50">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {websitePackage.headline}
        </h2>
        <p className="text-lg text-surface-600 text-center mt-3 max-w-lg mx-auto">
          {websitePackage.subheadline}
        </p>

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
            {/* Price header */}
            <div className="bg-surface-900 px-6 py-5 text-center">
              <p className="text-3xl font-extrabold text-white">
                {websitePackage.price}
                <span className="text-sm font-normal text-surface-400 ml-1">excl. BTW</span>
              </p>
              <p className="text-sm text-surface-400 mt-1">
                {websitePackage.priceNote}
              </p>
              <p className="text-lg font-bold text-brand-400 mt-2">
                {websitePackage.monthlyPrice}
              </p>
              <p className="text-sm text-surface-400">
                {websitePackage.monthlyNote}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                {websitePackage.monthlyIncludes}
              </p>
            </div>

            {/* Top CTA */}
            <div className="px-6 pt-6">
              <Link
                href="/demo"
                onClick={() => events.ctaClick("website-package", "top")}
                className="btn-primary w-full text-center block"
              >
                {websitePackage.cta}
              </Link>
              <p className="mt-2 text-xs text-surface-500 text-center">
                {websitePackage.ctaMicro}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* What's included */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wide mb-3">
                  Wat je krijgt
                </h3>
                <ul className="space-y-2">
                  {websitePackage.included.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-surface-700">
                      <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's NOT included */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wide mb-3">
                  Niet inbegrepen
                </h3>
                <ul className="space-y-2">
                  {websitePackage.notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-surface-500">
                      <svg className="w-5 h-5 text-surface-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                {"extraNote" in websitePackage && (
                  <p className="mt-3 text-sm text-brand-600 font-medium">
                    {websitePackage.extraNote}
                  </p>
                )}
              </div>

              {/* What we need */}
              <div className="bg-surface-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-surface-900 mb-1">
                  Wat we van jou nodig hebben
                </h3>
                <p className="text-sm text-surface-600">
                  {websitePackage.whatWeNeed}
                </p>
              </div>

              {/* Timeline */}
              <p className="text-sm text-surface-600 text-center font-medium">
                {websitePackage.timeline}
              </p>

              {/* Bottom CTA */}
              <Link
                href="/demo"
                onClick={() => events.ctaClick("website-package", "bottom")}
                className="btn-primary w-full text-center block"
              >
                {websitePackage.cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
