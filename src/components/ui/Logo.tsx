interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-110 -40 220 200"
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
  sm: { mark: 24, text: "text-sm" },
  md: { mark: 30, text: "text-base" },
  lg: { mark: 36, text: "text-lg" },
};

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-brand-500">
        <LogoMark size={s.mark} />
      </span>
      {showText && (
        <span className={`${s.text} font-light tracking-[0.25em] uppercase text-brand-500`}>
          Speed Clinics
        </span>
      )}
    </span>
  );
}
