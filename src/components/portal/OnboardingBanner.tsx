"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useBusiness } from "@/lib/hooks/useBusiness";

export function OnboardingBanner() {
  const { business, loading } = useBusiness();
  const pathname = usePathname();

  // Don't show on onboarding page itself
  if (pathname.startsWith("/portal/onboarding")) return null;
  if (loading || !business) return null;
  if (business.onboarding_completed_at) return null;
  if (business.plan === "website") return null;

  const details: string[] = [];
  if (!business.forwarding_confirmed) details.push("doorschakelen");
  if (!business.calendar_type) details.push("agenda");

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-amber-800 truncate">
            Je onboarding is nog niet afgerond{details.length > 0 ? ` — stel ${details.join(" en ")} in` : ""}
          </p>
        </div>
        <Link
          href="/portal/onboarding"
          className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap"
        >
          Afmaken →
        </Link>
      </div>
    </div>
  );
}
