import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gratis Gids: Online Aanwezigheid Kliniek Verbeteren",
  description:
    "Download de gratis gids voor cosmetische klinieken. Leer hoe u meer patiënten aantrekt, uw Google-score verbetert en 24/7 bereikbaar bent.",
  openGraph: {
    title: "Gratis Gids: Online Aanwezigheid Kliniek Verbeteren",
    description:
      "Download de gratis gids voor cosmetische klinieken. Meer patiënten, betere reviews, 24/7 bereikbaar.",
  },
};

export default function GidsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
