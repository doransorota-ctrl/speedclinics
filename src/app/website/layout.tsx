import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professionele Website voor Cosmetische Klinieken",
  description:
    "Een converterende website voor uw kliniek. Met AI-chatbot, online afspraken en automatische reviews. Op maat ingericht door Clŷniq.",
  openGraph: {
    title: "Professionele Website voor Cosmetische Klinieken",
    description:
      "Een converterende website voor uw kliniek. Met AI-chatbot, online afspraken en automatische reviews.",
  },
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
