"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatsAppDemo } from "@/components/landing/WhatsAppDemo";
import { MidPageCTA } from "@/components/landing/MidPageCTA";
import { SocialProof } from "@/components/landing/SocialProof";
import { FAQ } from "@/components/landing/FAQ";
import { Stats } from "@/components/landing/Stats";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { StickyCTA } from "@/components/ui/StickyCTA";
import { captureUTM, getLandingPage, getReferrer } from "@/lib/utm";
import { initScrollTracking } from "@/lib/analytics";
import { nl } from "@/content/nl";

export default function LandingPage() {
  useEffect(() => {
    captureUTM();
    getLandingPage();
    getReferrer();
    const cleanup = initScrollTracking();
    return cleanup;
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <WhatsAppDemo />
        <MidPageCTA />
        <SocialProof />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyCTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: nl.faq.groups
              .flatMap((g) => g.items as readonly { question: string; answer: string }[])
              .map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
          }).replace(/<\/script/gi, "<\\/script"),
        }}
      />
    </>
  );
}
