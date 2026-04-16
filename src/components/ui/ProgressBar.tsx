"use client";

interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-surface-200">
      <div
        className="h-full bg-brand-500 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
