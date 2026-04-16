interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <span
      className={`font-logo font-light tracking-[0.08em] text-surface-900 ${SIZES[size]} ${className}`}
    >
      Clŷniq
    </span>
  );
}
