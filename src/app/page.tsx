"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatsAppDemo } from "@/components/landing/WhatsAppDemo";
import { MidPageCTA } from "@/components/landing/MidPageCTA";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Stats } from "@/components/landing/Stats";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { StickyCTA } from "@/components/ui/StickyCTA";
import { captureUTM, getLandingPage, getReferrer } from "@/lib/utm";
import { initScrollTracking } from "@/lib/analytics";
import { nl } from "@/content/nl";

const clinicTestimonials = [
  {
    id: 1,
    name: "Dr. Lisa van der Berg",
    role: "Cosmetisch arts",
    company: "Kliniek Esthétique, Amsterdam",
    content:
      "Onze conversie is verdrievoudigd. Elke aanvraag wordt direct beantwoord en omgezet in een consult. En de automatische reviews hebben onze Google-score van 4.2 naar 4.9 gebracht.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 2,
    name: "Mark de Vries",
    role: "Kliniekhoudster",
    company: "LaserCenter, Rotterdam",
    content:
      "Patiënten kiezen voor de kliniek die het snelst reageert. Wij reageren nu binnen seconden — altijd. De review-functie is goud waard: nieuwe patiënten noemen onze reviews als reden om te kiezen.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: 3,
    name: "Dr. Sarah Hendriks",
    role: "Tandarts cosmetisch",
    company: "Velvet Smile Clinic, Utrecht",
    content:
      "De AI beantwoordt vragen over veneers en bleaching beter dan mijn receptie dat ooit deed. Elke patiënt krijgt perfect advies, wordt overtuigd en boekt direct. En na de behandeling: automatisch een review.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=150&h=150&fit=crop&crop=face",
  },
];

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
        <AnimatedTestimonials
          title="Wat klinieken zeggen"
          subtitle="Ontdek hoe klinieken in Nederland meer patiënten bereiken met Speed Clinics."
          badgeText="Vertrouwd door klinieken"
          testimonials={clinicTestimonials}
          autoRotateInterval={6000}
        />
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
