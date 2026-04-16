interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-120 -50 240 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 100, 30 L -30, 30 L -30, 90 L 100, 90 L 100, 150 L -100, 150 L -100, -30 L 100, -30"
        stroke="currentColor"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 22, text: "text-xl" },
  md: { mark: 28, text: "text-2xl" },
  lg: { mark: 36, text: "text-4xl" },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-brand-500">
        <LogoMark size={s.mark} />
      </span>
      <span className={`font-logo font-normal tracking-[0.06em] text-surface-900 ${s.text}`}>
        Clŷniq
      </span>
    </span>
  );
}
