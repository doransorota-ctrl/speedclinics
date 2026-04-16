import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verwerkersovereenkomst — Clŷniq",
  robots: { index: false, follow: false },
};

export default function VerwerkersovereenkomstPage() {
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
          Terug naar clyniq.nl
        </Link>

        <h1 className="text-3xl font-bold text-surface-900 mb-8">Verwerkersovereenkomst</h1>
        <div className="prose prose-surface max-w-none space-y-6 text-surface-700 text-sm leading-relaxed">

          <p className="text-surface-500">Laatst bijgewerkt: maart 2026</p>

          <p>
            Deze verwerkersovereenkomst (&ldquo;Overeenkomst&rdquo;) maakt onderdeel uit van de Algemene Voorwaarden
            tussen Clŷniq (handelsnaam van Fryno, KvK 98018272) en de Klant, en regelt de verwerking van
            persoonsgegevens door Clŷniq als verwerker namens de Klant als verwerkingsverantwoordelijke.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">1. Definities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Verwerker:</strong> Clŷniq (Fryno), die persoonsgegevens verwerkt in opdracht van de Verwerkingsverantwoordelijke</li>
              <li><strong>Verwerkingsverantwoordelijke:</strong> de Klant (de kliniek) die bepaalt welke gegevens worden verwerkt en voor welk doel</li>
              <li><strong>Betrokkenen:</strong> de natuurlijke personen (eindklanten/bellers) van wie persoonsgegevens worden verwerkt</li>
              <li><strong>Persoonsgegevens:</strong> alle gegevens die betrekking hebben op een geidentificeerde of identificeerbare natuurlijke persoon</li>
              <li><strong>AVG:</strong> de Algemene Verordening Gegevensbescherming (Verordening (EU) 2016/679)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">2. Onderwerp en duur</h2>
            <p>
              Deze overeenkomst heeft betrekking op de verwerking van persoonsgegevens van eindklanten (bellers/leads)
              door Clŷniq ten behoeve van de dienstverlening aan de Klant. De overeenkomst is van kracht gedurende
              de looptijd van het abonnement en eindigt wanneer alle persoonsgegevens zijn verwijderd.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">3. Aard en doel van de verwerking</h2>
            <p>Clŷniq verwerkt persoonsgegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Het automatisch opvangen van gemiste oproepen via WhatsApp</li>
              <li>Het kwalificeren van leads middels AI-gestuurde gesprekken</li>
              <li>Het inplannen van afspraken in de agenda van de Klant</li>
              <li>Het versturen van herinneringen aan betrokkenen</li>
              <li>Het notificeren van de Klant over nieuwe leads en afspraken</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">4. Soorten persoonsgegevens</h2>
            <p>De volgende categorieen persoonsgegevens worden verwerkt:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Telefoonnummers van bellers</li>
              <li>Namen (indien opgegeven door de beller)</li>
              <li>Adressen (indien opgegeven door de beller)</li>
              <li>Probleembeschrijvingen en gespreksinhoud via WhatsApp</li>
              <li>Afspraakgegevens (datum, tijd, locatie)</li>
              <li>Spraakopnames (alleen bij bellers met verborgen nummer, max 60 seconden)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">5. Categorieen betrokkenen</h2>
            <p>
              De betrokkenen zijn de eindklanten (bellers/leads) van de Klant die telefonisch of via WhatsApp contact
              opnemen met het bedrijf van de Klant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">6. Verplichtingen van de Verwerker</h2>
            <p>Clŷniq verplicht zich om:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Persoonsgegevens uitsluitend te verwerken op basis van schriftelijke instructies van de Klant</li>
              <li>Passende technische en organisatorische maatregelen te treffen ter beveiliging van de gegevens</li>
              <li>Medewerkers die toegang hebben tot persoonsgegevens te binden aan geheimhouding</li>
              <li>De Klant te ondersteunen bij het nakomen van verplichtingen ten aanzien van rechten van betrokkenen</li>
              <li>Na beeindiging van de overeenkomst alle persoonsgegevens te verwijderen binnen 90 dagen, tenzij opslag wettelijk verplicht is</li>
              <li>De Klant onverwijld op de hoogte te stellen van een datalek dat betrekking heeft op de persoonsgegevens</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">7. Subverwerkers</h2>
            <p>
              Clŷniq maakt gebruik van de volgende subverwerkers voor het leveren van de dienst:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm border border-surface-200">
                <thead>
                  <tr className="bg-surface-100">
                    <th className="px-4 py-2 text-left font-semibold border-b">Subverwerker</th>
                    <th className="px-4 py-2 text-left font-semibold border-b">Doel</th>
                    <th className="px-4 py-2 text-left font-semibold border-b">Locatie</th>
                    <th className="px-4 py-2 text-left font-semibold border-b">Waarborgen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2">Twilio Inc.</td>
                    <td className="px-4 py-2">Telefoongesprekken en WhatsApp</td>
                    <td className="px-4 py-2">VS</td>
                    <td className="px-4 py-2">SCCs, DPA</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2">OpenAI Inc.</td>
                    <td className="px-4 py-2">AI-gespreksvoering</td>
                    <td className="px-4 py-2">VS</td>
                    <td className="px-4 py-2">SCCs, DPA</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2">Stripe Inc.</td>
                    <td className="px-4 py-2">Betalingsverwerking</td>
                    <td className="px-4 py-2">VS</td>
                    <td className="px-4 py-2">SCCs, DPA</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2">Supabase Inc.</td>
                    <td className="px-4 py-2">Database en opslag</td>
                    <td className="px-4 py-2">EU (Ierland)</td>
                    <td className="px-4 py-2">DPA</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2">Google LLC</td>
                    <td className="px-4 py-2">Agenda-integratie</td>
                    <td className="px-4 py-2">VS/EU</td>
                    <td className="px-4 py-2">SCCs, CDPA</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2">Resend Inc.</td>
                    <td className="px-4 py-2">Transactionele e-mail</td>
                    <td className="px-4 py-2">VS</td>
                    <td className="px-4 py-2">SCCs, DPA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Railway Corp.</td>
                    <td className="px-4 py-2">Applicatiehosting</td>
                    <td className="px-4 py-2">VS</td>
                    <td className="px-4 py-2">SCCs, DPA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              De Verwerker informeert de Klant vooraf over wijzigingen in subverwerkers. De Klant heeft het recht bezwaar
              te maken tegen een nieuwe subverwerker. Met alle subverwerkers zijn verwerkersovereenkomsten gesloten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">8. Doorgifte buiten de EER</h2>
            <p>
              Voor de doorgifte van persoonsgegevens naar landen buiten de Europese Economische Ruimte (EER) maakt
              Clŷniq gebruik van de Standard Contractual Clauses (SCCs) zoals goedgekeurd door de Europese
              Commissie (Uitvoeringsbesluit 2021/914/EU). Met elke subverwerker buiten de EER is een DPA met SCCs
              overeengekomen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">9. Verplichtingen van de Verwerkingsverantwoordelijke</h2>
            <p>De Klant verplicht zich om:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ervoor te zorgen dat de verwerking van persoonsgegevens een rechtmatige grondslag heeft</li>
              <li>Betrokkenen (eindklanten) te informeren dat geautomatiseerde WhatsApp-berichten verstuurd kunnen worden na een gemiste oproep</li>
              <li>Te voldoen aan het WhatsApp Business Beleid van Meta</li>
              <li>Clŷniq te voorzien van correcte en actuele instructies met betrekking tot de verwerking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">10. Rechten van betrokkenen</h2>
            <p>
              Clŷniq ondersteunt de Klant bij het afhandelen van verzoeken van betrokkenen op grond van de AVG,
              waaronder het recht op inzage, rectificatie, verwijdering, beperking, dataportabiliteit en bezwaar.
            </p>
            <p>
              Betrokkenen kunnen zich uitschrijven voor berichten door &ldquo;STOP&rdquo; te sturen via WhatsApp.
              Voor verwijdering van alle opgeslagen gegevens kan een verzoek worden ingediend via info@clyniq.nl.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">11. Beveiliging</h2>
            <p>Clŷniq treft de volgende technische en organisatorische maatregelen:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Versleuteling van data in transit (TLS/HTTPS) en opslag</li>
              <li>Toegangscontrole op basis van rollen (Row Level Security)</li>
              <li>Beveiligde authenticatie (magic links, geen wachtwoorden opgeslagen)</li>
              <li>Content Security Policy (CSP) headers</li>
              <li>Rate limiting op API-endpoints</li>
              <li>Validatie van Twilio-webhooks ter voorkoming van spoofing</li>
              <li>Regelmatige beveiligingsaudits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">12. Datalekken</h2>
            <p>
              In het geval van een datalek dat betrekking heeft op persoonsgegevens, stelt Clŷniq de Klant hiervan
              onverwijld en uiterlijk binnen 48 uur op de hoogte. De melding bevat ten minste:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>De aard van het datalek</li>
              <li>De categorieen en het geschatte aantal betrokkenen</li>
              <li>De waarschijnlijke gevolgen</li>
              <li>De maatregelen die zijn genomen of voorgesteld om het lek te verhelpen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">13. Audits</h2>
            <p>
              De Klant heeft het recht om audits uit te (laten) voeren om de naleving van deze overeenkomst te
              controleren. Clŷniq zal hieraan redelijke medewerking verlenen. Audits vinden plaats na voorafgaande
              schriftelijke kennisgeving van ten minste 30 dagen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">14. Looptijd en beeindiging</h2>
            <p>
              Deze overeenkomst is van kracht zolang Clŷniq persoonsgegevens verwerkt namens de Klant. Na
              beeindiging van het abonnement worden alle persoonsgegevens binnen 90 dagen verwijderd, tenzij opslag
              wettelijk verplicht is.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mt-8 mb-3">15. Toepasselijk recht</h2>
            <p>
              Op deze verwerkersovereenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de
              bevoegde rechter in Nederland.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
