"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";

const features = [
  "Professionele 1-pagina website",
  "Mobiel-vriendelijk (responsive)",
  "WhatsApp-knop + contactformulier",
  "Google-vindbaar (SEO-basis)",
  "Eigen domeinnaam + SSL",
  "Hosting en onderhoud inbegrepen",
  "Klaar binnen 5 werkdagen",
];

const steps = [
  {
    num: "1",
    title: "We bellen 10 minuten",
    desc: "Wij vragen wat je doet, waar je werkt en wat je nodig hebt. Meer niet.",
  },
  {
    num: "2",
    title: "Wij bouwen je website",
    desc: "Binnen 5 werkdagen staat je website live. Jij hoeft niks te doen.",
  },
  {
    num: "3",
    title: "Je bent online",
    desc: "Klanten vinden je op Google en nemen direct contact op.",
  },
];

const faqs = [
  {
    q: "Heb ik een domeinnaam nodig?",
    a: "Nee, wij regelen je domeinnaam, hosting en SSL-certificaat. Alles zit inbegrepen.",
  },
  {
    q: "Kan ik later aanpassingen laten maken?",
    a: "Ja, kleine aanpassingen zijn inbegrepen bij het maandelijkse onderhoud. Grotere wijzigingen doen we op aanvraag.",
  },
  {
    q: "Heb ik foto's nodig?",
    a: "Niet per se. Wij gebruiken professionele stockfoto's die passen bij jouw vak. Eigen foto's zijn natuurlijk altijd beter.",
  },
  {
    q: "Wat als ik niet tevreden ben?",
    a: "We passen de website aan tot je tevreden bent. Geen kleine lettertjes.",
  },
  {
    q: "Kan ik Speed Leads er later bij nemen?",
    a: "Ja, je kunt op elk moment upgraden naar het Compleet pakket. Dan worden gemiste oproepen automatisch opgevangen via WhatsApp.",
  },
];

export default function WebsiteFunnelPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 pt-24 lg:pt-32 pb-16 text-center">
          <p className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">
            Voor vakmensen zonder website
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 leading-tight">
            Klanten zoeken je op Google.
            <br />
            <span className="text-red-500">Zonder website vinden ze je concurrent.</span>
          </h1>
          <p className="mt-6 text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
            Professionele website in 5 werkdagen. Vaste prijs. Wij regelen alles — jij hoeft alleen 10 minuten te bellen.
          </p>

          <div className="mt-8">
            <Link
              href="/demo?ref=website"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all"
            >
              Gratis adviesgesprek inplannen
            </Link>
            <p className="text-xs text-surface-400 mt-3">
              €500 eenmalig · €39/maand · Geen contract
            </p>
          </div>
        </section>

        {/* Example */}
        <section className="bg-surface-50 py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
            <div className="text-center mb-8">
              <p className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-2">Voorbeeld</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Zo kan jouw website eruitzien
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-xl">
              {/* Browser chrome */}
              <div className="bg-surface-100 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-flex items-center bg-white rounded-md px-3 py-1">
                    <svg className="w-3 h-3 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-surface-500 font-mono">jansen-loodgieter.nl</span>
                  </div>
                </div>
              </div>

              {/* Fake website */}
              <div className="bg-white">
                {/* Navbar */}
                <div className="px-6 sm:px-10 py-4 flex items-center justify-between border-b border-surface-100">
                  <div className="flex items-center gap-2.5">
                    {/* Logo */}
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L6.75 2.906" />
                      </svg>
                    </div>
                    <span className="font-bold text-surface-900 text-sm">Jansen Loodgietersbedrijf</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs text-surface-500">
                    <span>Diensten</span>
                    <span>Over ons</span>
                    <span>Contact</span>
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-semibold">Bel nu</div>
                  </div>
                </div>

                {/* Hero */}
                <div className="relative h-[280px] sm:h-[360px] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80"
                    alt="Loodgieter aan het werk"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-900/40" />
                  <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Loodgieter in Amsterdam</p>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight max-w-md">
                      Lekkage? Storing?<br />Wij staan direct klaar.
                    </h2>
                    <p className="text-white/70 mt-3 max-w-sm text-sm sm:text-base">
                      24/7 bereikbaar. Binnen 1 uur bij je. Vakkundig en betrouwbaar.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <div className="bg-green-500 text-white font-semibold py-2.5 px-5 rounded-lg text-sm flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp ons
                      </div>
                      <div className="bg-white text-blue-700 font-semibold py-2.5 px-5 rounded-lg text-sm flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Bel direct
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services strip */}
                <div className="px-6 sm:px-10 py-6 grid grid-cols-3 gap-4 border-t border-surface-100">
                  {[
                    { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", label: "Lekkages" },
                    { icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", label: "CV-ketels" },
                    { icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707", label: "Sanitair" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-surface-700">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-surface-400 text-center mt-4">
              Elke website wordt op maat gemaakt voor jouw bedrijf en vakgebied.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Wat je krijgt
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-surface-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-surface-50 py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
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

        {/* Pricing */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Eenvoudige, eerlijke prijs
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Website only */}
              <div className="bg-white rounded-2xl border-2 border-surface-200 p-6">
                <h3 className="text-lg font-bold text-surface-900 mb-1">Website</h3>
                <p className="text-sm text-surface-500 mb-4">Alles wat je nodig hebt om online te zijn.</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-surface-900">€500</span>
                  <span className="text-surface-400 ml-1">eenmalig</span>
                </div>
                <p className="text-sm text-surface-500 mb-6">+ €39/maand voor hosting en onderhoud</p>
                <Link
                  href="/demo?ref=website&plan=website"
                  className="block w-full text-center py-3 rounded-xl border-2 border-brand-500 text-brand-600 font-semibold hover:bg-brand-50 transition-colors"
                >
                  Adviesgesprek plannen
                </Link>
              </div>

              {/* Compleet */}
              <div className="bg-white rounded-2xl border-2 border-brand-500 p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Populair
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-1">Compleet</h3>
                <p className="text-sm text-surface-500 mb-4">Website + automatische leadopvolging.</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-surface-900">€500</span>
                  <span className="text-surface-400 ml-1">eenmalig</span>
                </div>
                <p className="text-sm text-surface-500 mb-6">+ €118/maand (website + Speed Leads)</p>
                <Link
                  href="/demo?ref=website&plan=compleet"
                  className="block w-full text-center py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
                >
                  Adviesgesprek plannen
                </Link>
                <p className="text-xs text-surface-400 mt-3 text-center">14 dagen gratis proberen</p>
              </div>
            </div>
            <p className="text-xs text-surface-400 text-center mt-4">Alle prijzen excl. BTW. Geen contract, opzeggen kan altijd.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface-50 py-16">
          <div className="max-w-2xl mx-auto px-5 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">
                Veelgestelde vragen
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-white rounded-xl border border-surface-200 p-5">
                  <h3 className="text-sm font-semibold text-surface-900">{faq.q}</h3>
                  <p className="text-sm text-surface-500 mt-2 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="max-w-xl mx-auto px-5 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-4">
              Klaar om online te gaan?
            </h2>
            <p className="text-surface-500 mb-8">
              Plan een gratis adviesgesprek van 10 minuten. Daarna bouwen wij je website.
            </p>
            <Link
              href="/demo?ref=website"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all"
            >
              Gratis adviesgesprek inplannen
            </Link>
            <p className="text-xs text-surface-400 mt-3">
              €500 eenmalig · €39/maand · Geen contract
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
