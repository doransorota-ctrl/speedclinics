import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan een demo",
  description:
    "Plan een gratis demo van 15 minuten en ontdek hoe Speed Leads automatisch je gemiste oproepen opvangt via WhatsApp en afspraken inplant.",
  openGraph: {
    title: "Plan een demo — Speed Leads",
    description:
      "Plan een gratis demo van 15 minuten en ontdek hoe Speed Leads automatisch je gemiste oproepen opvangt via WhatsApp en afspraken inplant.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
