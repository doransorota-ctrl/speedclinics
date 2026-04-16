"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ChoosePath() {
  const { choose } = nl;

  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-serif italic text-surface-900 text-center">
          {choose.headline}
        </h2>

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="bg-white border border-surface-100 shadow-sm shadow-black/5 rounded-2xl p-8">
            <span className="self-start text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-4 inline-block">
              {choose.hasWebsite.label}
            </span>

            <h3 className="text-2xl font-bold text-surface-900 mt-3">
              {choose.hasWebsite.title}
            </h3>
            <p className="text-sm font-medium text-brand-600 mt-1">
              {choose.hasWebsite.offer}
            </p>

            <ul className="mt-6 space-y-3">
              {choose.hasWebsite.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-surface-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/demo"
              onClick={() => events.ctaClick("choose", "has-website")}
              className="mt-8 btn-primary text-center w-full sm:w-auto"
            >
              {choose.hasWebsite.cta}
            </Link>
            <p className="mt-2 text-xs text-surface-400">
              {choose.hasWebsite.ctaMicro}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
