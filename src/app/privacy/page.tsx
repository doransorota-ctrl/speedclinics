import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — Speed Leads",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar speedleads.nl
        </Link>

        <h1 className="text-3xl font-bold text-surface-900 mb-8">Privacybeleid</h1>
        <div className="prose prose-surface max-w-none space-y-6 text-surface-700 text-sm leading-relaxed">

          <p className="text-surface-500">Laatst bijgewerkt: maart 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">1. Wie zijn wij?</h2>
            <p>
              Speed Leads (&ldquo;wij&rdquo;, &ldquo;ons&rdquo;) is een dienst die vakmensen helpt om gemiste oproepen automatisch op te vangen via WhatsApp. Wij zijn verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in dit privacybeleid.
            </p>
            <p>
              Speed Leads is een handelsnaam van Fryno.<br />
              E-mail: info@speedleads.nl<br />
              KvK-nummer: 98018272
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">2. Welke gegevens verzamelen wij?</h2>
            <p>Wij verzamelen de volgende persoonsgegevens:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accountgegevens:</strong> naam, bedrijfsnaam, e-mailadres, telefoonnummer, vakgebied, werkgebied</li>
              <li><strong>Leadgegevens:</strong> telefoonnummer van bellers, naam (indien opgegeven), probleem-beschrijving, adres, urgentie</li>
              <li><strong>Gespreksgegevens:</strong> WhatsApp-berichten tussen de AI-assistent en de klant</li>
              <li><strong>Technische gegevens:</strong> IP-adres, browsertype, apparaatinformatie (via cookies)</li>
              <li><strong>Betalingsgegevens:</strong> worden verwerkt door Stripe en niet door ons opgeslagen</li>
              <li><strong>Spraakopnames:</strong> korte voicemailberichten van bellers met verborgen nummer (maximaal 60 seconden)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">3. Waarvoor gebruiken wij je gegevens?</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Het leveren van onze dienst (leadopvang, WhatsApp-berichten, agenda-integratie)</li>
              <li>Het aanmaken en beheren van je account</li>
              <li>Het verwerken van betalingen via Stripe</li>
              <li>Het sturen van service-gerelateerde e-mails (bevestigingen, notificaties)</li>
              <li>Het verbeteren van onze dienst</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">4. Rechtsgrond</h2>
            <p>Wij verwerken je gegevens op basis van:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Uitvoering van de overeenkomst:</strong> nodig om de dienst te leveren</li>
              <li><strong>Toestemming:</strong> voor het koppelen van je Google Agenda</li>
              <li><strong>Gerechtvaardigd belang:</strong> voor het verbeteren van onze dienst en het voorkomen van fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">5. Delen met derden</h2>
            <p>Wij delen je gegevens met de volgende partijen:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Twilio:</strong> voor telefoongesprekken en WhatsApp-berichten. Twilio is gevestigd in de VS. De doorgifte van gegevens is gebaseerd op de Standard Contractual Clauses (SCCs) zoals goedgekeurd door de Europese Commissie.</li>
              <li><strong>OpenAI:</strong> voor de AI-gestuurde gespreksvoering. OpenAI is gevestigd in de VS. De doorgifte van gegevens is gebaseerd op de Standard Contractual Clauses (SCCs).</li>
              <li><strong>Stripe:</strong> voor betalingsverwerking. Stripe is gevestigd in de VS. De doorgifte van gegevens is gebaseerd op de Standard Contractual Clauses (SCCs).</li>
              <li><strong>Supabase:</strong> voor data-opslag (EU-servers, Ierland)</li>
              <li><strong>Google:</strong> voor agenda-integratie (alleen met jouw toestemming). Doorgifte gebaseerd op SCCs.</li>
              <li><strong>Resend:</strong> voor het versturen van transactionele e-mails. Resend is gevestigd in de VS. De doorgifte van gegevens is gebaseerd op de Standard Contractual Clauses (SCCs).</li>
              <li><strong>Railway:</strong> voor hosting van de applicatie. Railway is gevestigd in de VS. De doorgifte van gegevens is gebaseerd op de Standard Contractual Clauses (SCCs).</li>
            </ul>
            <p>Wij verkopen je gegevens nooit aan derden.</p>
            <p>Voor de doorgifte van persoonsgegevens naar landen buiten de Europese Economische Ruimte (EER) maken wij gebruik van de Standard Contractual Clauses (SCCs) zoals goedgekeurd door de Europese Commissie (Uitvoeringsbesluit 2021/914/EU). Met elke verwerker is een verwerkersovereenkomst (DPA) gesloten.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">6. Bewaartermijn</h2>
            <p>
              Wij bewaren je gegevens zolang je een actief account hebt. Na opzegging worden je gegevens binnen 90 dagen verwijderd, tenzij we wettelijk verplicht zijn ze langer te bewaren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">7. Je rechten</h2>
            <p>Je hebt het recht om:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Je gegevens in te zien (recht van inzage)</li>
              <li>Je gegevens te laten corrigeren (recht op rectificatie)</li>
              <li>Je gegevens te laten verwijderen (recht op vergetelheid)</li>
              <li>Je gegevens te ontvangen in een gestructureerd, gangbaar en machinaal leesbaar formaat (recht op dataportabiliteit)</li>
              <li>De verwerking van je gegevens te beperken (recht op beperking van verwerking)</li>
              <li>Bezwaar te maken tegen de verwerking van je gegevens (recht van bezwaar)</li>
              <li>Je toestemming in te trekken</li>
              <li>Een klacht in te dienen bij de Autoriteit Persoonsgegevens</li>
            </ul>
            <p>Neem contact met ons op via info@speedleads.nl voor verzoeken.</p>
            <p>Eindgebruikers (bellers/leads) die geen Speed Leads account hebben, kunnen ook een verzoek tot verwijdering indienen via info@speedleads.nl of door &ldquo;STOP&rdquo; te sturen via WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">8. Cookies</h2>
            <p>Wij gebruiken functionele cookies die nodig zijn voor het werken van de website en het inloggen. Daarnaast gebruiken wij, met jouw toestemming, de volgende analytische en marketing cookies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Analytics (GA4):</strong> voor het analyseren van websiteverkeer</li>
              <li><strong>Google Ads:</strong> voor het meten van advertentieprestaties</li>
              <li><strong>Meta Pixel:</strong> voor het meten van advertentieprestaties op Facebook en Instagram</li>
            </ul>
            <p>Deze cookies worden pas geplaatst nadat je hiervoor toestemming hebt gegeven via de cookiebanner. Je kunt je voorkeuren op elk moment wijzigen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">9. Beveiliging</h2>
            <p>
              Wij nemen passende technische en organisatorische maatregelen om je gegevens te beschermen, waaronder versleuteling van data in transit en opslag, toegangscontrole, en regelmatige beveiligingsaudits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">10. Datalekken</h2>
            <p>
              In het geval van een datalek dat waarschijnlijk een risico inhoudt voor je rechten en vrijheden, melden wij dit binnen 72 uur aan de Autoriteit Persoonsgegevens. Als het lek een hoog risico inhoudt voor jou als betrokkene, informeren wij je daar ook over zonder onredelijke vertraging.
            </p>
            <p>Vermoed je een beveiligingsincident? Meld het aan info@speedleads.nl.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">11. Wijzigingen</h2>
            <p>
              Wij kunnen dit privacybeleid wijzigen. De meest recente versie is altijd beschikbaar op deze pagina. Bij belangrijke wijzigingen informeren wij je per e-mail.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
