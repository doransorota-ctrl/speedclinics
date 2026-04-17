"use client";

import Link from "next/link";
import { nl } from "@/content/nl";
import { events } from "@/lib/analytics";
import { HeroAnimation } from "./HeroAnimation";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";

export function Hero() {
  const { hero } = nl;

  return (
    <AuroraBackground className="h-auto min-h-screen pt-20 pb-8 sm:pt-28 sm:pb-16 bg-surface-50">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mobile: stacked layout — text first, then phone */}
        {/* Desktop: side by side */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Text + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <h1 className="font-normal font-serif text-surface-900 leading-[1.15] italic">
              <span className="block text-[1.6rem] sm:text-5xl lg:text-7xl whitespace-nowrap">{hero.headline}</span>
              <span className="block text-[1.6rem] sm:text-5xl lg:text-7xl text-brand-500 whitespace-nowrap">{hero.headlineAccent}</span>
            </h1>

            <p className="mt-4 sm:mt-8 text-base sm:text-xl text-surface-500 max-w-2xl mx-auto lg:mx-0">
              {hero.subheadline}
            </p>

            {/* CTA */}
            <div className="mt-6 sm:mt-12 flex flex-col items-center lg:items-start gap-2">
              <Link
                href="/demo"
                onClick={() => events.ctaClick("hero", "primary")}
                className="btn-primary text-base sm:text-lg px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                {hero.ctaPrimary}
              </Link>
              <a
                href="#hoe-het-werkt"
                onClick={() => events.ctaClick("hero", "how-it-works")}
                className="text-sm text-surface-500 hover:text-brand-600 transition-colors underline underline-offset-2"
              >
                {hero.ctaSecondary}
              </a>
            </div>

            {/* Trust line */}
            <div className="hidden sm:flex mt-8 flex-wrap gap-x-4 gap-y-1 justify-center lg:justify-start">
              {hero.trust.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-sm text-surface-500">
                  <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>

            {/* Mobile trust — compact */}
            <div className="flex sm:hidden mt-4 justify-center gap-3">
              {hero.trust.map((item) => (
                <span key={item} className="text-[11px] text-surface-400">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Phone animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
            className="flex-shrink-0 w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[300px]"
          >
            <HeroAnimation />
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
}
