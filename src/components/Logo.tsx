import Link from "next/link";

type LogoProps = {
  variant?: "forest" | "cream";
  showMark?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ variant = "forest", showMark = true, size = "md" }: LogoProps) {
  const color = variant === "forest" ? "text-forest" : "text-cream-soft";
  const sizes = {
    sm: { mark: 22, wordmark: "text-base tracking-[0.28em]" },
    md: { mark: 28, wordmark: "text-lg tracking-[0.3em]" },
    lg: { mark: 36, wordmark: "text-2xl tracking-[0.32em]" },
  };
  const s = sizes[size];

  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${color} group`} aria-label="Indusequine home">
      {showMark && <LogoMark size={s.mark} />}
      <span className={`font-display ${s.wordmark} font-medium uppercase`}>
        Indusequine
      </span>
    </Link>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Outer ring — evokes a horseshoe arch */}
      <path
        d="M12 34 C 12 18, 22 8, 32 8 C 42 8, 52 18, 52 34 L 52 50 L 44 50 L 44 36 C 44 24, 38 18, 32 18 C 26 18, 20 24, 20 36 L 20 50 L 12 50 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      {/* Inner stylized I */}
      <line x1="32" y1="24" x2="32" y2="46" stroke="currentColor" strokeWidth="1.4" />
      <line x1="28" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.4" />
      <line x1="28" y1="46" x2="36" y2="46" stroke="currentColor" strokeWidth="1.4" />
      {/* Nail accents at base of horseshoe */}
      <circle cx="16" cy="44" r="1.2" fill="currentColor" />
      <circle cx="48" cy="44" r="1.2" fill="currentColor" />
      <circle cx="16" cy="38" r="1.2" fill="currentColor" />
      <circle cx="48" cy="38" r="1.2" fill="currentColor" />
    </svg>
  );
}
