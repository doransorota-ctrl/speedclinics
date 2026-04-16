import type { Metadata } from "next";
import { nl } from "@/content/nl";
import { OrganizationJsonLd, ServiceJsonLd, HowToJsonLd } from "@/components/seo/JsonLd";
import { CookieConsent } from "@/components/ui/CookieConsent";
import "./globals.css";

const BASE_URL = "https://speedleads.nl";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: nl.meta.title,
    template: "%s — clŷniq",
  },
  description: nl.meta.description,
  openGraph: {
    title: nl.meta.ogTitle,
    description: nl.meta.ogDescription,
    type: "website",
    locale: "nl_NL",
    url: BASE_URL,
    siteName: "clŷniq",
    images: [
      {
        url: "https://speedleads.nl/opengraph-image",
        width: 1200,
        height: 630,
        alt: "clŷniq — AI-receptie voor klinieken",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: nl.meta.ogTitle,
    description: nl.meta.ogDescription,
  },
  robots: { index: true, follow: true },
  keywords: [
    "cosmetische kliniek software",
    "kliniek leadgeneratie",
    "WhatsApp automatisering klinieken",
    "patiëntopvolging",
    "automatische afspraken kliniek",
    "clŷniq",
    "cosmetische behandelingen",
    "kliniek receptie AI",
    "Nederland",
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
