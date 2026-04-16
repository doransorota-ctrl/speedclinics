import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan een demo",
  description:
    "Plan een gratis demo van 15 minuten en ontdek hoe Speed Clinics automatisch je gemiste oproepen opvangt via WhatsApp en afspraken inplant.",
  openGraph: {
    title: "Plan een demo — Speed Clinics",
    description:
      "Plan een gratis demo van 15 minuten en ontdek hoe Speed Clinics automatisch je gemiste oproepen opvangt via WhatsApp en afspraken inplant.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
