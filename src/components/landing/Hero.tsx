"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";
import { HeroAnimation } from "./HeroAnimation";

export function Hero() {
  const { hero } = nl;

  return (
    <section className="pt-20 pb-8 sm:pt-32 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left — text + CTAs */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 leading-tight">
            {hero.headline}
            <br />
            <span className="text-brand-500">{hero.headlineAccent}</span>
          </h1>

          <p className="mt-3 sm:mt-5 text-base sm:text-xl text-surface-600 max-w-2xl mx-auto lg:mx-0">
            {hero.subheadline}
          </p>

          {/* CTA */}
          <div className="mt-5 sm:mt-8 flex flex-col items-center lg:items-start">
            <Link
              href="/demo"
              onClick={() => events.ctaClick("hero", "primary")}
              className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
            >
              {hero.ctaPrimary}
            </Link>
            <p className="mt-2 text-xs text-surface-500">
              {hero.pricingAnchor}
            </p>
            <a
              href="#hoe-het-werkt"
              onClick={() => events.ctaClick("hero", "how-it-works")}
              className="mt-2 text-sm text-surface-500 hover:text-brand-600 transition-colors underline underline-offset-2"
            >
              {hero.ctaSecondary}
            </a>
          </div>

          {/* Trust line — desktop only */}
          <div className="hidden sm:flex mt-5 flex-wrap gap-x-4 gap-y-1 justify-center lg:justify-start">
            {hero.trust.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-sm text-surface-500">
                <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right — animated demo */}
        <div className="flex-shrink-0">
          <HeroAnimation />
        </div>
      </div>
    </section>
  );
}
