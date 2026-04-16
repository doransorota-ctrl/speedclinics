"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function Pricing() {
  const { pricing } = nl;

  return (
    <section id="prijzen" className="section bg-surface-50">
      <div className="section-inner">
        <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 text-center">
          {pricing.headline}
        </h2>
        <p className="text-lg text-surface-600 text-center mt-3 max-w-lg mx-auto">
          {pricing.subheadline}
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1: Speed Leads (Software) */}
          <div className="bg-white border-2 border-brand-500 rounded-xl p-6 flex flex-col relative">
            <span className="absolute -top-3 left-6 text-xs font-semibold text-white bg-brand-500 px-3 py-1 rounded-full">
              Meest gekozen
            </span>

            <span className="self-start text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-4">
              {pricing.software.label}
            </span>

            <h3 className="text-xl font-bold text-surface-900">
              {pricing.software.name}
            </h3>
            <p className="text-sm text-surface-500 mt-0.5">
              {pricing.software.description}
            </p>

            <div className="mt-4 mb-5">
              <span className="text-4xl font-extrabold text-surface-900">
                &euro;{pricing.software.price}
              </span>
              <span className="text-sm text-surface-500 ml-1">
                {pricing.software.priceLabel}
              </span>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {pricing.software.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-surface-700">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={pricing.software.href}
              onClick={() => events.pricingCta("speed-leads")}
              className="btn-primary text-center w-full py-3 text-base font-semibold"
            >
              {pricing.software.cta}
            </Link>

            <p className="mt-3 text-xs text-surface-500 text-center leading-snug">
              {pricing.guaranteeBadge}
            </p>
          </div>

          {/* Card 2: Compleet Pakket (Website + Software) */}
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-6 flex flex-col">
            <span className="self-start text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md mb-4">
              {pricing.complete.label}
            </span>

            <h3 className="text-xl font-bold text-surface-900">
              {pricing.complete.name}
            </h3>
            <p className="text-sm text-surface-500 mt-0.5">
              {pricing.complete.description}
            </p>

            <div className="mt-4 mb-1">
              <span className="text-4xl font-extrabold text-surface-900">
                &euro;{pricing.complete.setupPrice}
              </span>
              <span className="text-sm text-surface-500 ml-1">
                eenmalig
              </span>
            </div>
            <p className="text-sm font-semibold text-brand-600 mb-5">
              + &euro;{pricing.complete.monthlyPrice}{pricing.complete.priceLabel}
            </p>

            <ul className="space-y-2.5 mb-6 flex-1">
              {pricing.complete.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-surface-700">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={pricing.complete.href}
              onClick={() => events.pricingCta("compleet")}
              className="block text-center rounded-lg py-3 text-base font-semibold transition-colors w-full bg-white hover:bg-surface-100 text-surface-800 border border-surface-300"
            >
              {pricing.complete.cta}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-surface-500">
          {pricing.websiteOnly}{" "}
          <a href="/demo" className="text-brand-600 font-semibold hover:text-brand-700 underline underline-offset-2">
            {pricing.websiteOnlyLink}
          </a>
        </p>

        <p className="mt-4 text-center text-sm text-surface-500">
          {pricing.guarantee}
        </p>
        <p className="mt-2 text-center text-sm font-medium text-brand-600">
          {pricing.roiNote}
        </p>
      </div>
    </section>
  );
}
