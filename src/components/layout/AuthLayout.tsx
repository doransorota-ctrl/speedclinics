"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface AuthLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  progressPercent?: number;
  mobileProof?: React.ReactNode;
}

export function AuthLayout({
  children,
  rightPanel,
  progressPercent,
  mobileProof,
}: AuthLayoutProps) {
  return (
    <>
      {progressPercent != null && progressPercent > 0 && (
        <ProgressBar percent={progressPercent} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] min-h-screen">
        <div className="bg-white px-4 sm:px-8 lg:px-12 py-8 lg:py-0 flex flex-col lg:justify-center">
          {/* Mobile social proof banner */}
          {mobileProof && <div className="lg:hidden mb-6">{mobileProof}</div>}
          <div className="w-full max-w-lg mx-auto">{children}</div>
        </div>
        {rightPanel && (
          <div className="hidden lg:flex bg-surface-50 border-l border-surface-200 px-8 lg:px-10 py-10 flex-col justify-center">
            <div className="max-w-md mx-auto w-full">{rightPanel}</div>
          </div>
        )}
      </div>
    </>
  );
}
