import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Probeer Clŷniq — Klant belt. Jij bent bezig. Wij pakken het op.",
  description: "Bekijk de demo of probeer het zelf — bel het nummer en kijk wat er gebeurt. Gemiste oproep → WhatsApp → Afspraak. Automatisch.",
  openGraph: {
    title: "Klant belt. Jij bent bezig. Wij pakken het op.",
    description: "Bekijk de demo of probeer het zelf — bel het nummer en kijk wat er gebeurt.",
    type: "website",
    url: "https://speedleads.nl/probeer",
  },
  robots: { index: true, follow: true },
};

export default function ProbeerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
