import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden — Clŷniq",
};

export default function VoorwaardenPage() {
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

        <h1 className="text-3xl font-bold text-surface-900 mb-8">Algemene Voorwaarden</h1>
        <div className="prose prose-surface max-w-none space-y-6 text-surface-700 text-sm leading-relaxed">

          <p className="text-surface-500">Laatst bijgewerkt: maart 2026</p>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">Bedrijfsgegevens</h2>
            <p>
              Clŷniq is een handelsnaam van Fryno<br />
              KVK-nummer: 98018272<br />
              E-mail: info@speedleads.nl
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">1. Definities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clŷniq:</strong> de dienstverlener, aanbieder van het Clŷniq platform</li>
              <li><strong>Klant:</strong> de ondernemer/vakman die gebruik maakt van Clŷniq</li>
              <li><strong>Dienst:</strong> het automatisch opvangen van gemiste oproepen via WhatsApp, leadkwalificatie, en agenda-integratie</li>
              <li><strong>Lead:</strong> een potentiële klant die contact opneemt via telefoon of WhatsApp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">2. Toepasselijkheid</h2>
            <p>
              Deze algemene voorwaarden zijn van toepassing op alle diensten van Clŷniq. Door je aan te melden ga je akkoord met deze voorwaarden.
            </p>
            <p>
              Deze dienst is uitsluitend bedoeld voor ondernemers en bedrijven (handelend in de uitoefening van een beroep of bedrijf). Door je aan te melden verklaar je dat je handelt als ondernemer en niet als consument.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">3. Dienstverlening</h2>
            <p>Clŷniq biedt de volgende diensten aan:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clŷniq (€79/maand excl. BTW):</strong> automatische leadopvolging via WhatsApp bij gemiste oproepen, leadkwalificatie, en optionele agenda-integratie</li>
              <li><strong>Website Pakket (€500 eenmalig + €39/maand excl. BTW):</strong> professionele website inclusief hosting en beheer</li>
              <li><strong>Compleet Pakket (€500 eenmalig + €118/maand excl. BTW):</strong> website + Clŷniq gecombineerd</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">4. Proefperiode</h2>
            <p>
              Het Clŷniq en Compleet pakket bevatten een gratis proefperiode van 14 dagen. Na afloop wordt het abonnement automatisch verlengd tegen het geldende tarief, tenzij je voor het einde van de proefperiode opzegt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">5. Betaling</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Betalingen worden verwerkt via Stripe</li>
              <li>Maandelijkse abonnementen worden automatisch verlengd</li>
              <li>Eenmalige kosten worden vooraf in rekening gebracht</li>
              <li>Bij niet-betaling kan de dienst worden opgeschort</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">6. Opzegging</h2>
            <p>
              Je kunt je abonnement op elk moment opzeggen via het klantenportaal. Na opzegging blijft de dienst actief tot het einde van de lopende factureringsperiode. Er vindt geen restitutie plaats voor reeds betaalde periodes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">7. Beschikbaarheid</h2>
            <p>
              Wij streven naar een beschikbaarheid van 99,5%. Wij zijn niet aansprakelijk voor schade als gevolg van onbeschikbaarheid door overmacht, onderhoud, of storingen bij derden (Twilio, WhatsApp, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">8. AI-Assistent</h2>
            <p>
              De AI-assistent communiceert namens jouw bedrijf met leads. Hoewel wij streven naar nauwkeurigheid, kan de AI fouten maken. Je bent zelf verantwoordelijk voor het controleren van gemaakte afspraken en verstrekte informatie.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">9. Aansprakelijkheid</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Clŷniq is niet aansprakelijk voor indirecte schade, gevolgschade, of gederfde winst</li>
              <li>Onze aansprakelijkheid is beperkt tot het bedrag dat je in de afgelopen 3 maanden aan ons hebt betaald</li>
              <li>Wij zijn niet aansprakelijk voor het gedrag van de AI-assistent in gesprekken met leads</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">10. Intellectueel eigendom</h2>
            <p>
              Alle intellectuele eigendomsrechten op het Clŷniq platform, inclusief software, design, en content, berusten bij Clŷniq. De website die wij voor je bouwen wordt jouw eigendom na volledige betaling.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">11. Privacy</h2>
            <p>
              Wij verwerken persoonsgegevens conform ons{" "}
              <Link href="/privacy" className="text-brand-600 hover:text-brand-700 font-medium">
                privacybeleid
              </Link>
              . Door gebruik te maken van onze dienst stem je in met de verwerking van gegevens zoals daar beschreven.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">12. WhatsApp Business Beleid</h2>
            <p>
              Clŷniq verstuurt namens jouw bedrijf automatische WhatsApp-berichten naar bellers. Als klant ben je verantwoordelijk voor het informeren van je eigen klanten dat zij geautomatiseerde berichten kunnen ontvangen na een gemiste oproep. Je dient te voldoen aan het WhatsApp Business Beleid van Meta. Bellers kunnen zich uitschrijven door &ldquo;STOP&rdquo; te sturen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">13. Gegevensverwerking</h2>
            <p>
              Clŷniq verwerkt persoonsgegevens van jouw klanten (leads) namens jou als verwerker. De voorwaarden voor deze verwerking zijn vastgelegd in onze{" "}
              <Link href="/verwerkersovereenkomst" className="text-brand-600 hover:text-brand-700 font-medium">
                verwerkersovereenkomst
              </Link>
              , die onderdeel uitmaakt van deze overeenkomst.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">14. Geschillen</h2>
            <p>
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">15. Wijzigingen</h2>
            <p>
              Wij behouden het recht om deze voorwaarden te wijzigen. Bij belangrijke wijzigingen informeren wij je 30 dagen van tevoren per e-mail.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
