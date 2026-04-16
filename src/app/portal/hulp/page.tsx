"use client";

import { useBusiness } from "@/lib/hooks/useBusiness";

const sections = [
  {
    title: "Hoe werkt Clŷniq?",
    items: [
      {
        q: "Wat gebeurt er als iemand mij belt?",
        a: "Als je niet opneemt, stuurt Clŷniq binnen 5 seconden een WhatsApp naar de beller. De AI voert het gesprek, stelt vragen over het probleem, en plant een afspraak in je agenda.",
      },
      {
        q: "Wat doet de AI precies?",
        a: "De AI appt als jij — kort, casual, geen callcenter-taal. Hij vraagt wat het probleem is, checkt je beschikbaarheid in Google Agenda, en stelt een tijd voor. Pas na bevestiging van de klant wordt de afspraak ingepland.",
      },
      {
        q: "Kan ik het gesprek overnemen?",
        a: "Ja. Ga naar Gesprekken, open het gesprek, en klik op 'Neem over'. De AI stopt en jij kunt zelf verder appen met de klant.",
      },
    ],
  },
  {
    title: "Doorschakelen",
    items: [
      {
        q: "Hoe stel ik doorschakelen in?",
        a: "Je belt twee korte codes: een voor 'niet opnemen' en een voor 'in gesprek'. Dit kan via de aan/uit knop op je Dashboard, of via Instellingen. Na het bellen van de codes hoor je een bevestiging van je provider.",
      },
      {
        q: "Hoe zet ik doorschakelen uit?",
        a: "Tik op de aan/uit knop op je Dashboard en bel de code ##002#. Dit zet alle doorschakelingen uit.",
      },
      {
        q: "Werkt het met mijn privénummer?",
        a: "Ja. De klant ziet alleen je bedrijfsnaam op WhatsApp, niet je privénummer. Je nummer blijft altijd privé.",
      },
    ],
  },
  {
    title: "Google Agenda",
    items: [
      {
        q: "Hoe koppel ik mijn agenda?",
        a: "Ga naar Instellingen en klik op 'Koppel Google Agenda'. Je logt in met je Google account en geeft toestemming. Clŷniq kan dan je beschikbaarheid checken en afspraken inplannen.",
      },
      {
        q: "Kan Clŷniq mijn afspraken zien?",
        a: "Clŷniq checkt alleen wanneer je vrij of bezet bent. We lezen geen details van bestaande afspraken.",
      },
      {
        q: "Wat als ik geen Google Agenda heb?",
        a: "Dan plant de AI afspraken in op basis van je ingestelde werkuren, zonder te checken of je al iets hebt staan. We raden aan om Google Agenda te koppelen voor de beste ervaring.",
      },
    ],
  },
  {
    title: "Gesprekken & Contacten",
    items: [
      {
        q: "Wat is het verschil tussen Gesprekken en Contacten?",
        a: "Gesprekken toont alle individuele interacties (elke gemiste oproep is een apart gesprek). Contacten toont unieke klanten — als dezelfde klant 3x belt, zie je daar 1 contact met 3 gesprekken.",
      },
      {
        q: "Kan ik een klant direct bellen of appen?",
        a: "Ja. Bij elk gesprek en contact staan WhatsApp en bel-knoppen. Tik erop om direct contact op te nemen.",
      },
    ],
  },
  {
    title: "Abonnement & Betaling",
    items: [
      {
        q: "Wat kost Clŷniq?",
        a: "Prijs op maat. Opzeggen kan altijd, zonder opzegtermijn.",
      },
      {
        q: "Hoe zeg ik op?",
        a: "Ga naar Facturatie en klik op 'Beheer abonnement'. Daar kun je je abonnement direct opzeggen via Stripe.",
      },
    ],
  },
];

export default function HulpPage() {
  const { business } = useBusiness();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Hulp & Tips</h1>
        <p className="text-surface-500 mt-1">Alles wat je moet weten over Clŷniq.</p>
      </div>

      {/* Quick info */}
      {business?.twilio_number && (
        <div className="bg-white rounded-xl border border-surface-200 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-surface-900">Je Clŷniq nummer</p>
              <p className="text-lg font-mono text-surface-700 mt-0.5">{business.twilio_number}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(business.twilio_number!)}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Kopieer
            </button>
          </div>
          <p className="text-xs text-surface-400 mt-2">Dit is het nummer waar gemiste oproepen naartoe worden doorgeschakeld.</p>
        </div>
      )}

      {/* FAQ sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="font-semibold text-surface-900">{section.title}</h2>
            </div>
            <div className="divide-y divide-surface-50">
              {section.items.map((item) => (
                <div key={item.q} className="px-5 py-4">
                  <h3 className="text-sm font-medium text-surface-900">{item.q}</h3>
                  <p className="text-sm text-surface-500 mt-1.5 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Support */}
      <div className="mt-8 bg-brand-50 border border-brand-200 rounded-xl p-5 text-center">
        <h3 className="text-sm font-semibold text-brand-800">Nog een vraag?</h3>
        <p className="text-xs text-brand-700 mt-1 mb-3">Stuur een berichtje en we helpen je direct.</p>
        <a
          href="https://wa.me/31624980044"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm px-6 py-2.5 inline-block"
        >
          WhatsApp support
        </a>
      </div>
    </div>
  );
}
