import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inloggen",
  description:
    "Log in op je clŷniq dashboard om je leads, afspraken en gesprekken te beheren.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
