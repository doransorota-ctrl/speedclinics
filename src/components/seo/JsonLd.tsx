export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Speed Leads",
    url: "https://speedleads.nl",
    description:
      "Automatische leadopvolging via WhatsApp en professionele websites voor vakmensen in Nederland.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Speed Leads",
        price: "59",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "59",
          priceCurrency: "EUR",
          billingDuration: "P1M",
        },
        description:
          "Automatische leadopvolging via WhatsApp. 14 dagen gratis proberen.",
      },
      {
        "@type": "Offer",
        name: "Website Pakket",
        price: "500",
        priceCurrency: "EUR",
        description:
          "Professionele website in 5 werkdagen + €39/maand hosting.",
      },
      {
        "@type": "Offer",
        name: "Compleet Pakket",
        price: "500",
        priceCurrency: "EUR",
        description:
          "Website + leadopvolging. €500 eenmalig + €98/maand.",
      },
    ],
    provider: {
      "@type": "Organization",
      name: "Speed Leads",
      url: "https://speedleads.nl",
      logo: "https://speedleads.nl/opengraph-image",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: "Dutch",
      },
      areaServed: {
        "@type": "Country",
        name: "NL",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function ServiceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Speed Leads — AI Receptionist voor Vakmensen",
    description:
      "Speed Leads is een AI-gestuurde receptionist die automatisch gemiste oproepen opvangt via WhatsApp, leads kwalificeert, en afspraken inplant in Google Calendar. Speciaal ontwikkeld voor Nederlandse vakmensen zoals loodgieters, schilders, elektriciens en aannemers.",
    provider: {
      "@type": "Organization",
      name: "Speed Leads",
    },
    areaServed: {
      "@type": "Country",
      name: "Netherlands",
    },
    serviceType: "AI Lead Management",
    offers: {
      "@type": "Offer",
      price: "59",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "59",
        priceCurrency: "EUR",
        unitText: "maand",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function HowToJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Hoe werkt Speed Leads?",
    description: "In 4 stappen mis je nooit meer een klant",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Klant belt",
        text: "Een potentiële klant vindt je online en belt je nummer.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Je mist de oproep",
        text: "Je bent op een klus en kunt niet opnemen. De oproep wordt doorgeschakeld naar Speed Leads.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "WhatsApp wordt verstuurd",
        text: "Speed Leads stuurt binnen 10 seconden automatisch een WhatsApp naar de beller met een persoonlijk bericht.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Afspraak wordt ingepland",
        text: "De AI chatbot kwalificeert de lead en plant een afspraak in je Google Calendar.",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

export function FAQJsonLd({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
}
