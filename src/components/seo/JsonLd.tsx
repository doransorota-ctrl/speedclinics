export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Speed Clinics",
    url: "https://speedleads.nl",
    description:
      "AI-receptie voor cosmetische klinieken. Automatische patiëntopvolging via WhatsApp, 24/7.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Speed Clinics",
        priceCurrency: "EUR",
        description:
          "AI-receptie en automatische patiëntopvolging via WhatsApp voor klinieken.",
      },
    ],
    provider: {
      "@type": "Organization",
      name: "Speed Clinics",
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
    name: "Speed Clinics — AI-receptie voor cosmetische klinieken",
    description:
      "Speed Clinics is een AI-gestuurde receptie die aanvragen buiten openingstijden automatisch opvangt via WhatsApp, vragen over behandelingen beantwoordt en consulten inplant. Op maat voor cosmetische klinieken in Nederland.",
    provider: {
      "@type": "Organization",
      name: "Speed Clinics",
    },
    areaServed: {
      "@type": "Country",
      name: "Netherlands",
    },
    serviceType: "AI Patient Management",
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
    name: "Hoe werkt Speed Clinics?",
    description: "In 4 stappen mist uw kliniek nooit meer een patiënt",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Patiënt neemt contact op",
        text: "Een patiënt vraagt via WhatsApp, telefoon of uw website informatie over een behandeling.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Speed Clinics reageert direct",
        text: "Binnen 10 seconden ontvangt de patiënt een persoonlijk WhatsApp-bericht namens uw kliniek.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Vragen worden beantwoord",
        text: "De AI beantwoordt vragen over behandelingen, prijzen en beschikbaarheid — afgestemd op uw aanbod.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Consult ingepland",
        text: "De patiënt boekt direct een consult. U ontvangt een melding met alle details.",
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
