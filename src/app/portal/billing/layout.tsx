import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturatie",
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
