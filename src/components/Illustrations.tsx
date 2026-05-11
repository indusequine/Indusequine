export function HorseSilhouette() {
  return (
    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <path
        d="M 120 480 C 140 380 200 340 240 320 C 220 280 230 240 260 220 C 280 180 320 160 360 170 C 380 130 420 110 460 120 C 510 100 560 110 590 150 C 630 160 660 200 670 250 C 700 260 720 290 720 330 C 730 380 720 430 700 470 L 680 480 L 660 460 C 660 440 650 420 640 410 C 580 430 520 420 480 390 C 460 410 440 420 420 420 C 400 430 380 420 360 410 C 340 430 320 440 300 440 C 280 460 260 470 240 470 L 220 460 L 200 480 L 180 470 L 160 480 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="600" cy="190" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function HorseshoePattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="horseshoes" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g transform="translate(60 60)" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M -18 -22 C -18 -32, -10 -38, 0 -38 C 10 -38, 18 -32, 18 -22 L 18 12 L 12 12 L 12 -18 C 12 -26, 6 -30, 0 -30 C -6 -30, -12 -26, -12 -18 L -12 12 L -18 12 Z" />
            <circle cx="-14" cy="6" r="0.8" fill="currentColor" />
            <circle cx="14" cy="6" r="0.8" fill="currentColor" />
            <circle cx="-14" cy="-2" r="0.8" fill="currentColor" />
            <circle cx="14" cy="-2" r="0.8" fill="currentColor" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#horseshoes)" />
    </svg>
  );
}

export function HoofPattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="hooves" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
          <g transform="translate(80 80) rotate(20)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="14" ry="18" />
            <ellipse cx="0" cy="-2" rx="9" ry="13" fill="var(--color-forest)" />
          </g>
          <g transform="translate(20 30) rotate(-30)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="10" ry="13" />
            <ellipse cx="0" cy="-1" rx="6" ry="9" fill="var(--color-forest)" />
          </g>
          <g transform="translate(130 120) rotate(50)" fill="currentColor">
            <ellipse cx="0" cy="0" rx="11" ry="14" />
            <ellipse cx="0" cy="-1" rx="7" ry="10" fill="var(--color-forest)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hooves)" />
    </svg>
  );
}

type SaddleVariant = "rider" | "horse" | "stable";

export function SaddlePattern({ variant }: { variant: SaddleVariant }) {
  if (variant === "rider") return <RiderMotif />;
  if (variant === "horse") return <HorseMotif />;
  return <StableMotif />;
}

function RiderMotif() {
  // Riding helmet
  return (
    <svg viewBox="0 0 200 200" className="w-2/3 h-2/3" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M 50 130 C 50 90 70 60 100 60 C 130 60 150 90 150 130 L 155 130 L 155 140 L 45 140 L 45 130 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M 70 105 L 130 105" stroke="currentColor" strokeWidth="1" />
      <path d="M 75 90 L 125 90" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M 80 75 L 120 75" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="100" cy="62" r="3" fill="currentColor" opacity="0.7" />
      {/* Chinstrap suggestion */}
      <path d="M 60 130 L 55 150" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path d="M 140 130 L 145 150" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function HorseMotif() {
  // Stylized horse head profile
  return (
    <svg viewBox="0 0 200 200" className="w-2/3 h-2/3" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M 50 50 L 62 35 L 75 38 L 80 60 L 100 70 L 130 80 L 145 100 L 150 130 L 145 155 L 135 165 L 125 158 L 122 140 L 105 130 L 90 135 L 78 150 L 70 158 L 60 155 L 55 140 L 60 120 L 55 100 L 45 80 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Mane lines */}
      <path d="M 55 60 L 45 70 M 60 50 L 50 55 M 65 42 L 58 45" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      {/* Eye */}
      <circle cx="100" cy="95" r="2" fill="currentColor" />
      {/* Nostril */}
      <ellipse cx="142" cy="135" rx="2" ry="3" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function StableMotif() {
  // Stable / barn silhouette
  return (
    <svg viewBox="0 0 200 200" className="w-2/3 h-2/3" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Barn outline */}
      <path
        d="M 30 90 L 100 50 L 170 90 L 170 160 L 30 160 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Roof line */}
      <path d="M 30 90 L 170 90" stroke="currentColor" strokeWidth="1.5" />
      {/* Stable door (Dutch door) */}
      <rect x="80" y="105" width="40" height="55" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <line x1="80" y1="130" x2="120" y2="130" stroke="currentColor" strokeWidth="1.2" />
      <line x1="100" y1="105" x2="100" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* Side windows */}
      <rect x="45" y="115" width="22" height="22" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
      <rect x="133" y="115" width="22" height="22" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
      <line x1="56" y1="115" x2="56" y2="137" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <line x1="45" y1="126" x2="67" y2="126" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <line x1="144" y1="115" x2="144" y2="137" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <line x1="133" y1="126" x2="155" y2="126" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      {/* Weather vane */}
      <line x1="100" y1="50" x2="100" y2="35" stroke="currentColor" strokeWidth="1" />
      <path d="M 95 35 L 105 35 L 100 28 Z" fill="currentColor" />
    </svg>
  );
}
