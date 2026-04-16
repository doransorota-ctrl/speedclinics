import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gesprekken",
};

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
