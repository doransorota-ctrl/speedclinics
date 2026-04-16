"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";

const features = [
  "Professionele website op maat voor uw kliniek",
  "Behandelpagina's met duidelijke informatie",
  "Online afspraken boeken via WhatsApp",
  "Mobiel-vriendelijk en snel",
  "SEO-geoptimaliseerd voor lokale vindbaarheid",
  "AI-chatbot die aanvragen 24/7 opvangt",
  "Automatische review-verzoeken na behandelingen",
];

const steps = [
  {
    num: "1",
    title: "Kennismakingsgesprek",
    desc: "Wij bespreken uw kliniek, behandelaanbod en wensen. 15 minuten, vrijblijvend.",
  },
  {
    num: "2",
    title: "Wij richten alles in",
    desc: "Website, chatbot en reviews — volledig op maat. U hoeft technisch niets te doen.",
  },
  {
    num: "3",
    title: "Uw kliniek is live",
    desc: "Patiënten vinden u online, krijgen direct antwoord en boeken consulten.",
  },
];

const faqs = [
  {
    q: "Wat is inbegrepen in de service?",
    a: "Alles: professionele website, AI-chatbot voor WhatsApp, automatische afspraakplanning, herinneringen en review-verzoeken. Volledig op maat voor uw kliniek.",
  },
  {
    q: "Hoelang duurt het voordat we live zijn?",
    a: "Gemiddeld is uw kliniek binnen twee weken volledig operationeel. Wij regelen alles — u hoeft technisch niets te doen.",
  },
  {
    q: "Wat als ik al een website heb?",
    a: "Dan integreren wij de chatbot en automatisering met uw bestaande website. Of wij bouwen een nieuwe die beter past bij uw kliniek.",
  },
  {
    q: "Hoe zit het met de privacy van patiëntgegevens?",
    a: "Wij verwerken alleen contactgegevens en behandelinteresse — geen medische dossiers. Alles conform de AVG met een verwerkersovereenkomst.",
  },
  {
    q: "Zit ik vast aan een contract?",
    a: "Nee. De service is maandelijks opzegbaar. Geen opzegkosten, geen kleine lettertjes.",
  },
];

export default function WebsiteFunnelPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-50">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 sm:px-8 pt-24 lg:pt-32 pb-16 text-center">
          <p className="text-sm font-medium text-brand-600 uppercase tracking-widest mb-4">
            Voor cosmetische klinieken
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-surface-900 leading-tight">
            Uw complete online aanwezigheid.
            <br />
            <span className="text-brand-500">Wij regelen alles.</span>
          </h1>
          <p className="mt-6 text-lg text-surface-500 max-w-2xl mx-auto leading-relaxed">
            Van professionele website tot AI-chatbot die patiënten 24/7 te woord staat.
            Meer consulten, minder gemiste aanvragen, sterkere online reputatie.
          </p>

          <div className="mt-10">
            <Link
              href="/demo?ref=website"
              className="btn-primary text-lg py-4 px-10"
            >
              Boek een demo
            </Link>
            <p className="text-xs text-surface-400 mt-3">
              Gratis demo · Geen verplichtingen
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Wat wij voor uw kliniek verzorgen
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-accent-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-surface-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Hoe het werkt
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Veelgestelde vragen
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-white rounded-2xl border border-surface-100 shadow-sm shadow-black/5 p-5">
                  <h3 className="text-sm font-semibold text-surface-900">{faq.q}</h3>
                  <p className="text-sm text-surface-500 mt-2 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-surface-800 py-16">
          <div className="max-w-xl mx-auto px-6 sm:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Klaar om meer patiënten te bereiken?
            </h2>
            <p className="text-surface-300 mb-8">
              Boek een vrijblijvende demo en ontdek wat wij voor uw kliniek kunnen betekenen.
            </p>
            <Link
              href="/demo?ref=website"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-lg py-4 px-10 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/20"
            >
              Boek een demo
            </Link>
            <p className="text-xs text-surface-400 mt-3">
              Geen verplichtingen · Op maat ingericht
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
