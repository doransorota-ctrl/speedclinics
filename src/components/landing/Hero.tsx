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
    <AuroraBackground className="h-auto min-h-screen pt-20 pb-8 sm:pt-32 sm:pb-16 bg-surface-50">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left — text + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="flex-1 text-center lg:text-left"
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-surface-900 leading-[1.08]">
            {hero.headline}
            <br />
            <span className="text-brand-500">{hero.headlineAccent}</span>
          </h1>

          <p className="mt-5 sm:mt-8 text-lg sm:text-xl text-surface-500 max-w-2xl mx-auto lg:mx-0">
            {hero.subheadline}
          </p>

          {/* CTA */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center lg:items-start">
            <Link
              href="/demo"
              onClick={() => events.ctaClick("hero", "primary")}
              className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
            >
              {hero.ctaPrimary}
            </Link>
            <p className="mt-2 text-xs text-surface-400">
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
        </motion.div>

        {/* Right — animated demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <HeroAnimation />
        </motion.div>
      </div>
    </AuroraBackground>
  );
}
