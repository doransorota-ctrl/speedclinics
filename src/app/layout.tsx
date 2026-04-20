import type { Metadata } from "next";
import { nl } from "@/content/nl";
import { OrganizationJsonLd, ServiceJsonLd, HowToJsonLd } from "@/components/seo/JsonLd";
import { CookieConsent } from "@/components/ui/CookieConsent";
import "./globals.css";

const BASE_URL = "https://clyniq.nl";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: nl.meta.title,
    template: "%s — Clŷniq",
  },
  description: nl.meta.description,
  openGraph: {
    title: nl.meta.ogTitle,
    description: nl.meta.ogDescription,
    type: "website",
    locale: "nl_NL",
    url: BASE_URL,
    siteName: "Clŷniq",
    images: [
      {
        url: "https://clyniq.nl/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Clŷniq — AI-receptie voor klinieken",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: nl.meta.ogTitle,
    description: nl.meta.ogDescription,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://clyniq.nl",
  },
  keywords: [
    "AI receptie kliniek",
    "digitale receptionist cosmetische kliniek",
    "automatische afspraken kliniek",
    "WhatsApp automatisering klinieken",
    "patiënten management software",
    "kliniek leadgeneratie",
    "cosmetische kliniek software",
    "cosmetische behandelingen",
    "botox kliniek afspraken",
    "fillers kliniek management",
    "automatische reviews kliniek",
    "Google reviews cosmetische kliniek",
    "online agenda kliniek",
    "patiëntopvolging",
    "24/7 bereikbare kliniek",
    "no-show preventie kliniek",
    "kliniek software Nederland",
    "Clŷniq",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="scroll-smooth overflow-x-hidden">
      <body className="antialiased overflow-x-hidden">
        <OrganizationJsonLd />
        <ServiceJsonLd />
        <HowToJsonLd />
        <CookieConsent />
        {children}
      </body>
    </html>
  );
}
