"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ChoosePath() {
  const { choose } = nl;

  return (
    <section className="section bg-surface-50">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {choose.headline}
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card A: No website */}
          <div className="bg-white border border-surface-200 rounded-xl p-6 flex flex-col">
            {/* Audience label */}
            <span className="self-start text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md mb-4">
              {choose.noWebsite.label}
            </span>

            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-surface-900">
              {choose.noWebsite.title}
            </h3>
            <p className="text-sm font-semibold text-brand-600 mt-1">
              {choose.noWebsite.offer}
            </p>

            <ul className="mt-4 space-y-2 flex-1">
              {choose.noWebsite.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="#website-pakket"
              onClick={() => events.ctaClick("choose", "no-website")}
              className="mt-5 btn-secondary text-center w-full"
            >
              {choose.noWebsite.cta}
            </a>
            <p className="mt-2 text-xs text-surface-500 text-center">
              {choose.noWebsite.ctaMicro}
            </p>
          </div>

          {/* Card B: Has website */}
          <div className="bg-white border border-surface-200 rounded-xl p-6 flex flex-col">
            {/* Audience label */}
            <span className="self-start text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-4">
              {choose.hasWebsite.label}
            </span>

            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-surface-900">
              {choose.hasWebsite.title}
            </h3>
            <p className="text-sm font-semibold text-brand-600 mt-1">
              {choose.hasWebsite.offer}
            </p>

            <ul className="mt-4 space-y-2 flex-1">
              {choose.hasWebsite.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-surface-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/demo"
              onClick={() => events.ctaClick("choose", "has-website")}
              className="mt-5 btn-primary text-center w-full"
            >
              {choose.hasWebsite.cta}
            </Link>
            <p className="mt-2 text-xs text-surface-500 text-center">
              {choose.hasWebsite.ctaMicro}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-surface-600">
          <a
            href="/demo"
            className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            {choose.compleetLink}
          </a>
        </p>
      </div>
    </section>
  );
}
